import type { Request, Response } from "express";
import { logger } from "../utils/logger";
import { config } from "../config";
import prisma from "db/client";
import { Prisma } from "@prisma/client";

export const listWebhooks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const webhooks = await prisma.webhookRegistration.findMany({
      where: { userId: req.userId },
      include: {
        configuration: true,
      },
    });

    const configIds = webhooks.map((w) => w.configurationId);

    const eventCounts = await prisma.dataSyncLog.groupBy({
      by: ["configId"],
      _count: {
        id: true,
      },
      where: {
        configId: {
          in: configIds,
        },
      },
    });

    const lastEvents = await prisma.$queryRaw`
      SELECT DISTINCT ON ("configId") "configId", "createdAt"
      FROM "data_sync_logs"
      WHERE "configId" IN (${Prisma.join(configIds)})
      ORDER BY "configId", "createdAt" DESC
    `;

    const countMap = Object.fromEntries(
      eventCounts.map((e) => [e.configId, e._count.id])
    );

    const lastEventMap = Object.fromEntries(
      Array.isArray(lastEvents)
        ? lastEvents.map((e) => [e.configId, e.createdAt])
        : []
    );

    const formattedWebhooks = webhooks.map((w) => ({
      id: w.id,
      configurationId: w.configurationId,
      configurationName: w.configuration.name,
      webhookUrl: `${config.apiBaseUrl}/webhook/${w.webhookPath}`,
      createdAt: w.createdAt,
      status: w.configuration.enabled ? "active" : "inactive",
      lastTriggered: lastEventMap[w.configurationId] || null,
      eventCount: countMap[w.configurationId] || 0,
    }));

    res.json({
      success: true,
      webhooks: formattedWebhooks,
    });
  } catch (error) {
    logger.error("Failed to list webhooks", error as Error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Webhook ID is required" });
      return;
    }
    const result = await prisma.webhookRegistration.deleteMany({
      where: {
        id,
        userId: req.userId,
      },
    });

    if (result.count === 0) {
      res.status(404).json({ error: "Webhook not found" });
      return;
    }

    res.json({
      success: true,
      message: "Webhook deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete webhook", error as Error);
    res.status(500).json({ error: "Internal server error" });
  }
};
