import { z } from "zod";
import prisma from "db/client";
import type { Request, Response } from "express";
import { indexingConfigSchema } from "types";
import crypto from "crypto";
import { config } from "../config";

export const getAllIndexingConfiguration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    const configs = await prisma.indexingConfiguration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: configs });
  } catch (error) {
    console.error("Error fetching configurations:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch configurations" });
  }
};

export const getByIdIndexingConfiguration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!id) {
      res.status(400).json({ success: false, message: "ID is required" });
      return;
    }

    const config = await prisma.indexingConfiguration.findFirst({
      where: { id, userId },
      include: {
        syncLogs: {
          take: 5,
          orderBy: { startTime: "desc" },
        },
      },
    });

    if (!config) {
      res
        .status(404)
        .json({ success: false, message: "Configuration not found" });
      return;
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error("Error fetching configuration:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch configuration" });
  }
};

export const createIndexingConfiguration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    console.log("Creating configuration for user:", userId);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const validatedData = indexingConfigSchema.parse(req.body);

    const credential = await prisma.databaseCredential.findUnique({
      where: {
        userId,
        id: validatedData.credentialId,
      },
    });

    const newConfig = await prisma.indexingConfiguration.create({
      data: {
        name: validatedData.name,
        network: validatedData.network,
        enabled: validatedData.enabled,
        categories: validatedData.categories,
        userId,
        databaseCredentialId: credential?.id,
      },
    });

    const randomString = crypto.randomBytes(16).toString("hex");
    const webhookHash = crypto
      .createHmac("sha256", config.webhookSecret)
      .update(`${userId}:${newConfig}:${randomString}`)
      .digest("hex");

    const webhookPath = `${webhookHash}`;

    await prisma.webhookRegistration.create({
      data: {
        userId,
        configurationId: newConfig.id,
        webhookPath,
      },
    });

    const webhookUrl = `${config.apiBaseUrl}/webhook/${webhookPath}`;

    res.status(201).json({
      success: true,
      webhookUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
      return;
    }

    console.error("Error creating webhook:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create configuration",
    });
  }
};

export const updateIndexingConfiguration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!id) {
      res.status(400).json({ success: false, message: "ID is required" });
      return;
    }

    const existingConfig = await prisma.indexingConfiguration.findFirst({
      where: { id, userId },
    });

    if (!existingConfig) {
      res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
      return;
    }

    const validatedData = indexingConfigSchema.parse(req.body);

    const updatedConfig = await prisma.indexingConfiguration.update({
      where: { id },
      data: validatedData,
    });

    res.status(200).json({
      success: true,
      message: "Configuration updated successfully",
      data: updatedConfig,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
      return;
    }
    console.error("Error updating configuration:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update configuration",
    });
  }
};

export const toggleEnabledIndexingConfiguration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!id) {
      res.status(400).json({ success: false, message: "ID is required" });
      return;
    }

    const config = await prisma.indexingConfiguration.findFirst({
      where: { id, userId },
    });

    if (!config) {
      res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
      return;
    }

    const updatedConfig = await prisma.indexingConfiguration.update({
      where: { id },
      data: { enabled: !config.enabled },
    });

    res.status(200).json({
      success: true,
      message: `Configuration ${updatedConfig.enabled ? "enabled" : "disabled"} successfully`,
      data: updatedConfig,
    });
  } catch (error) {
    console.error("Error toggling configuration status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update configuration status",
    });
  }
};

export const deleteIndexingConfiguration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!id) {
      res.status(400).json({ success: false, message: "ID is required" });
      return;
    }

    const existingConfig = await prisma.indexingConfiguration.findFirst({
      where: { id, userId },
    });

    if (!existingConfig) {
      res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
      return;
    }

    await prisma.indexingConfiguration.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Configuration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting configuration:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete configuration",
    });
  }
};

export const getSyncStatsIndexingConfiguration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!id) {
      res.status(400).json({ success: false, message: "ID is required" });
      return;
    }

    const existingConfig = await prisma.indexingConfiguration.findFirst({
      where: { id, userId },
    });

    if (!existingConfig) {
      res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
      return;
    }

    const syncLogs = await prisma.dataSyncLog.findMany({
      where: { configId: id },
      orderBy: { startTime: "desc" },
      take: 10,
    });

    const [transactions, nfts, tokens, marketData] = await Promise.all([
      prisma.transaction.count({ where: { configId: id } }),
      prisma.nFT.count({ where: { configId: id } }),
      prisma.token.count({ where: { configId: id } }),
      prisma.marketData.count({ where: { configId: id } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        syncLogs,
        dataCounts: {
          transactions,
          nfts,
          tokens,
          marketData,
        },
        lastSync: syncLogs[0] || null,
      },
    });
  } catch (error) {
    console.error("Error fetching sync statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sync statistics",
    });
  }
};
