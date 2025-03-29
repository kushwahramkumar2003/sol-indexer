import type { Request, Response } from "express";
import { kafkaProducer } from "../kafka/producer";
import { logger } from "../utils/logger";
import { IndexingCategory } from "@prisma/client";
import prisma from "db/client";
import { identifyEventType, parseEventData, EventType } from "parser";

export const handleWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { webhookPath } = req.params;

    // console.log("webhook body", req.body);

    if (!webhookPath) {
      res.status(400).json({ error: "Webhook path is required" });
      return;
    }

    const webhook = await prisma.webhookRegistration.findUnique({
      where: { webhookPath },
      include: {
        configuration: {
          include: {
            user: true,
            credential: true,
          },
        },
      },
    });

    console.log("webhook", webhook);

    if (!webhook) {
      logger.warn(`Invalid webhook path: ${webhookPath}`);
      res.status(404).json({ error: "Webhook not found" });
      return;
    }

    if (!webhook.configuration.enabled) {
      logger.warn(`Configuration is disabled: ${webhook.configurationId}`);
      res.status(400).json({ error: "Configuration is disabled" });
      return;
    }

    const transactions = Array.isArray(req.body) ? req.body : [req.body];
    if (transactions.length === 0) {
      logger.warn(`Empty payload received`);
      res.status(400).json({ error: "Empty payload" });
      return;
    }

    const eventType = identifyEventType(transactions[0]);
    // const parsedData = parseEventData(transactions[0]);

    // console.log("eventType", eventType);
    // console.log("parsedData", parsedData);

    const categoryMap: Partial<Record<EventType, IndexingCategory>> = {
      [EventType.NFT_BID]: IndexingCategory.NFT_BIDS,
      [EventType.NFT_LISTING]: IndexingCategory.NFT_PRICES,
      [EventType.NFT_SALE]: IndexingCategory.NFT_PRICES,
      [EventType.LOAN]: IndexingCategory.TOKEN_BORROW,
      [EventType.TRANSFER]: IndexingCategory.TRANSACTIONS,
    };

    // console.log("categoryMap", categoryMap);

    const indexingCategory =
      categoryMap[eventType] || IndexingCategory.TRANSACTIONS;

    // console.log("indexingCategory", indexingCategory);

    if (!webhook.configuration.categories.includes(indexingCategory)) {
      logger.warn(`Event type not supported by configuration: ${eventType}`);
      res.status(400).json({ error: "Event type not supported" });
      return;
    }

    const credentials = webhook.configuration.credential;
    if (!credentials) {
      logger.warn(`No database credentials found for user: ${webhook.userId}`);
      res.status(400).json({ error: "No database credentials found" });
      return;
    }

    const message = {
      topic: "webhook-events",
      messages: [
        {
          key: webhook.userId,
          value: JSON.stringify({
            configId: webhook.configurationId,
            eventType: indexingCategory,
            network: webhook.configuration.network,
            data: { ...transactions[0], type: indexingCategory },
            credentials,
          }),
          headers: { "event-type": eventType },
        },
      ],
    };

    await kafkaProducer.send(message);

    await prisma.systemLog.create({
      data: {
        level: "INFO",
        message: `Webhook processed for user ${webhook.userId}`,
        context: {
          eventType,
          configId: webhook.configurationId,
          transactionCount: transactions.length,
        },
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error("Webhook processing failed:", error as Error);

    await prisma.systemLog.create({
      data: {
        level: "ERROR",
        message: "Webhook processing failed",
        context: { error: (error as Error).message },
      },
    });

    res.status(500).json({ error: "Internal server error" });
  }
};
