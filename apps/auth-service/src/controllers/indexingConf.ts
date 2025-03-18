import { IndexingCategory, BlockchainNetwork } from "@prisma/client";
import { z } from "zod";
import prisma from "db/client";
import type { Request, Response } from "express";

// Validation schema for creating/updating configurations
const indexingConfigSchema = z.object({
  name: z.string().min(3).max(100),
  categories: z.array(z.nativeEnum(IndexingCategory)).min(1),
  network: z.nativeEnum(BlockchainNetwork).default("SOLANA_MAINNET"),
  enabled: z.boolean().default(true),
});

export const getAllIndexingConfiguration = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId; // Assuming auth middleware sets req.user

    const configs = await prisma.indexingConfiguration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: configs });
  } catch (error) {
    console.error("Error fetching configurations:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch configurations" });
  }
};

// Get a specific configuration by id
export const getByIdIndexingConfiguration = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

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
      return res
        .status(404)
        .json({ success: false, message: "Configuration not found" });
    }

    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error("Error fetching configuration:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch configuration" });
  }
};

// Create a new configuration
export const createIndexingConfiguration = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Validate request body
    const validatedData = indexingConfigSchema.parse(req.body);

    // Create configuration
    const newConfig = await prisma.indexingConfiguration.create({
      data: {
        ...validatedData,
        userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Configuration created successfully",
      data: newConfig,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error creating configuration:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create configuration",
    });
  }
};

// Update an existing configuration
export const updateIndexingConfiguration = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Check if configuration exists and belongs to user
    const existingConfig = await prisma.indexingConfiguration.findFirst({
      where: { id, userId },
    });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
    }

    // Validate request body
    const validatedData = indexingConfigSchema.parse(req.body);

    // Update configuration
    const updatedConfig = await prisma.indexingConfiguration.update({
      where: { id },
      data: validatedData,
    });

    return res.status(200).json({
      success: true,
      message: "Configuration updated successfully",
      data: updatedConfig,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error updating configuration:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update configuration",
    });
  }
};

// Toggle enabled status
export const toggleEnabledIndexingConfiguration = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const config = await prisma.indexingConfiguration.findFirst({
      where: { id, userId },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
    }

    const updatedConfig = await prisma.indexingConfiguration.update({
      where: { id },
      data: { enabled: !config.enabled },
    });

    return res.status(200).json({
      success: true,
      message: `Configuration ${updatedConfig.enabled ? "enabled" : "disabled"} successfully`,
      data: updatedConfig,
    });
  } catch (error) {
    console.error("Error toggling configuration status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update configuration status",
    });
  }
};

// Delete a configuration
export const deleteIndexingConfiguration = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Check if configuration exists and belongs to user
    const existingConfig = await prisma.indexingConfiguration.findFirst({
      where: { id, userId },
    });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
    }

    // Delete configuration (cascade will delete related data)
    await prisma.indexingConfiguration.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Configuration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting configuration:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete configuration",
    });
  }
};

// Get sync statistics for a configuration
export const getSyncStatsIndexingConfiguration = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Check if configuration exists and belongs to user
    const existingConfig = await prisma.indexingConfiguration.findFirst({
      where: { id, userId },
    });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found",
      });
    }

    // Get sync logs
    const syncLogs = await prisma.dataSyncLog.findMany({
      where: { configId: id },
      orderBy: { startTime: "desc" },
      take: 10,
    });

    // Get counts of related data
    const [transactions, nfts, tokens, marketData] = await Promise.all([
      prisma.transaction.count({ where: { configId: id } }),
      prisma.nFT.count({ where: { configId: id } }),
      prisma.token.count({ where: { configId: id } }),
      prisma.marketData.count({ where: { configId: id } }),
    ]);

    return res.status(200).json({
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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sync statistics",
    });
  }
};
