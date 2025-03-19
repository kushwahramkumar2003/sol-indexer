// controllers/webhook.controller.ts
import type { Request, Response } from "express";
import { kafkaProducer } from "../kafka/producer";
import { WebhookModel } from "../models/webhook.model";
import { log } from "../utils/logger";
import { PrismaClient, IndexingCategory } from "@prisma/client";
import crypto from "crypto";
import { config } from "../config";

const prisma = new PrismaClient();

export async function createWebhook(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { configurationId } = req.body;

    // Verify the configuration exists and belongs to the user
    const configuration = await prisma.indexingConfiguration.findFirst({
      where: {
        id: configurationId,
        userId: req.user.id,
      },
    });

    if (!configuration) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    // Create webhook URL
    const webhookUrl = await WebhookModel.createWebhook(
      req.user.id,
      configurationId
    );

    res.status(201).json({
      success: true,
      webhookUrl,
    });
  } catch (error) {
    log.error("Failed to create webhook", error as Error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function listWebhooks(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const webhooks = await WebhookModel.listWebhooks(req.user.id);

    res.json({
      success: true,
      webhooks: webhooks.map((w) => ({
        id: w.id,
        configurationId: w.configurationId,
        configurationName: w.configuration.name,
        webhookUrl: `${config.apiBaseUrl}/webhook/${w.webhookPath}`,
        createdAt: w.createdAt,
      })),
    });
  } catch (error) {
    log.error("Failed to list webhooks", error as Error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteWebhook(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Webhook ID is required" });
    }
    const result = await WebhookModel.deleteWebhook(id, req.user.id);

    if (result.count === 0) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    res.json({
      success: true,
      message: "Webhook deleted successfully",
    });
  } catch (error) {
    log.error("Failed to delete webhook", error as Error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleWebhook(req: Request, res: Response) {
  try {
    const { webhookPath } = req.params;

    if (!webhookPath) {
      return res.status(400).json({ error: "Webhook path is required" });
    }
    // Find the webhook registration
    const webhook = await WebhookModel.getWebhookByPath(webhookPath);

    if (!webhook) {
      log.warn(`Invalid webhook path: ${webhookPath}`);
      return res.status(404).json({ error: "Webhook not found" });
    }

    // Verify the configuration is enabled
    if (!webhook.configuration.enabled) {
      log.warn(`Configuration is disabled: ${webhook.configurationId}`);
      return res.status(400).json({ error: "Configuration is disabled" });
    }

    // Process the webhook based on the event type
    const eventType = determineEventType(req.body);

    if (!eventType) {
      log.warn(`Could not determine event type from payload`);
      return res.status(400).json({ error: "Invalid event type" });
    }

    // Verify the configuration supports this event type
    if (!webhook.configuration.categories.includes(eventType)) {
      log.warn(`Event type not supported by configuration: ${eventType}`);
      return res.status(400).json({ error: "Event type not supported" });
    }

    // Process the webhook data
    const credentials = webhook.configuration.user.databaseCredentials[0];

    if (!credentials) {
      log.warn(`No database credentials found for user: ${webhook.userId}`);
      return res.status(400).json({ error: "No database credentials found" });
    }

    // Send to Kafka
    const message = {
      topic: "webhook-events",
      messages: [
        {
          key: webhook.userId,
          value: JSON.stringify({
            configId: webhook.configurationId,
            eventType,
            network: webhook.configuration.network,
            data: req.body,
            credentials,
          }),
          headers: { "event-type": eventType },
        },
      ],
    };

    await kafkaProducer.send(message);

    // Log successful processing
    await prisma.systemLog.create({
      data: {
        level: "INFO",
        message: `Webhook processed for user ${webhook.userId}`,
        context: { eventType, configId: webhook.configurationId },
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    log.error("Webhook processing failed:", error as Error);

    await prisma.systemLog.create({
      data: {
        level: "ERROR",
        message: "Webhook processing failed",
        context: { error: (error as Error).message },
      },
    });

    res.status(500).json({ error: "Internal server error" });
  }
}

// Helper function to determine event type from payload
function determineEventType(payload: any): IndexingCategory | null {
  // NFT Bids - Look for specific properties in the payload
  if (payload.mintAddress && payload.bidAmount && payload.bidder) {
    return IndexingCategory.NFT_BIDS;
  }

  // NFT Prices - Look for specific properties in the payload
  if (payload.mintAddress && payload.price && payload.marketplace) {
    return IndexingCategory.NFT_PRICES;
  }

  // Token Borrow - Look for specific properties in the payload
  if (payload.mintAddress && payload.borrowAmount && payload.borrower) {
    return IndexingCategory.TOKEN_BORROW;
  }

  // Token Prices - Look for specific properties in the payload
  if (payload.mintAddress && payload.price && payload.currencyPair) {
    return IndexingCategory.TOKEN_PRICES;
  }

  // Transactions - Look for specific properties in the payload
  if (payload.txHash && payload.blockNumber) {
    return IndexingCategory.TRANSACTIONS;
  }

  // Explicit event type field
  if (
    payload.eventType &&
    Object.values(IndexingCategory).includes(payload.eventType)
  ) {
    return payload.eventType as IndexingCategory;
  }

  return null;
}
