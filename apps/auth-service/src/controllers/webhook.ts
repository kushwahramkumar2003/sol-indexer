import type { Request, Response } from "express";
import { log } from "../utils/logger";
import { PrismaClient } from "@prisma/client";
import { config } from "../config";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function createWebhook(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.userId;

    const { configurationId } = req.body;

    // Verify the configuration exists and belongs to the user
    const configuration = await prisma.indexingConfiguration.findFirst({
      where: {
        id: configurationId,
        userId,
      },
    });

    if (!configuration) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    const randomString = crypto.randomBytes(16).toString("hex");
    const webhookHash = crypto
      .createHmac("sha256", config.webhookSecret)
      .update(`${userId}:${configuration}:${randomString}`)
      .digest("hex");

    const webhookPath = `${webhookHash}`;

    // Store the webhook registration
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
}

export async function listWebhooks(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
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
}

export async function deleteWebhook(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Webhook ID is required" });
    }
    const result = await prisma.webhookRegistration.deleteMany({
      where: {
        id,
        userId: req.userId,
      },
    });

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
