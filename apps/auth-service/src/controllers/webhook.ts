import type { Request, Response } from "express";
import { log } from "../utils/logger";
import { config } from "../config";
import crypto from "crypto";
import prisma from "db/client";
import { createWebhookSchema } from "types";

export const createWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = req.userId;

    const parsedData = createWebhookSchema.safeParse(req.body);

    if (!parsedData.success) {
      res.status(400).json({
        error: "Invalid input data",
        errors: parsedData.error.errors,
      });
      return;
    }

    const { configurationId } = parsedData.data;

    const configuration = await prisma.indexingConfiguration.findFirst({
      where: {
        id: configurationId,
        userId,
      },
    });

    if (!configuration) {
      res.status(404).json({ error: "Configuration not found" });
      return;
    }

    const randomString = crypto.randomBytes(16).toString("hex");
    const webhookHash = crypto
      .createHmac("sha256", config.webhookSecret)
      .update(`${userId}:${configuration}:${randomString}`)
      .digest("hex");

    const webhookPath = `${webhookHash}`;

  
    await prisma.webhookRegistration.create({
      data: {
        userId,
        configurationId,
        webhookPath,
      },
    });

    const webhookUrl = `${config.apiBaseUrl}/webhook/${webhookPath}`;

    res.status(201).json({
      success: true,
      webhookUrl,
    });
  } catch (error) {
    log.error("Failed to create webhook", error as Error);
    res.status(500).json({ error: "Internal server error" });
  }
};

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
    log.error("Failed to delete webhook", error as Error);
    res.status(500).json({ error: "Internal server error" });
  }
};
