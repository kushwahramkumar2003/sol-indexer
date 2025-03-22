import prisma from "db/client";
import type { Request, Response } from "express";
import {
  createDatabaseCredentials,
  updateDatabaseCredentialsSchema,
} from "types";

export const addDatabaseCredentials = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parsedData = createDatabaseCredentials.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({
        message: "Invalid input data",
        errors: parsedData.error.errors,
      });
      return;
    }

    const { userId, host, port, database, username, password, ssl } =
      parsedData.data;

    const dbCredentials = await prisma.databaseCredential.create({
      data: {
        userId,
        host,
        port,
        database,
        username,
        password,
        ssl: ssl ?? false,
      },
    });

    res.status(201).json({
      success: true,
      data: dbCredentials,
    });
  } catch (error) {
    console.error("Error adding database credentials:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getDatabaseCredentialsById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({
        success: false,
        message: "ID is required",
      });
      return;
    }

    const dbCredentials = await prisma.databaseCredential.findUnique({
      where: { id },
    });

    if (!dbCredentials) {
      res.status(404).json({
        success: false,
        message: "Database credentials not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: dbCredentials,
    });
  } catch (error) {
    console.error("Error fetching database credentials by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getDatabaseCredentials = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [dbCredentials, total] = await Promise.all([
      prisma.databaseCredential.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.databaseCredential.count({
        where: { userId },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: dbCredentials,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching database credentials:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteDatabaseCredentials = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({
        success: false,
        message: "ID is required",
      });
      return;
    }

    const existingCredential = await prisma.databaseCredential.findUnique({
      where: { id },
    });

    if (!existingCredential) {
      res.status(404).json({
        success: false,
        message: "Database credentials not found",
      });
      return;
    }

    await prisma.databaseCredential.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Database credentials deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting database credentials:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateDatabaseCredentials = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parsedData = updateDatabaseCredentialsSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: parsedData.error.errors,
      });
      return;
    }

    const { id, host, port, database, username, password, ssl } =
      parsedData.data;

    const existingCredential = await prisma.databaseCredential.findUnique({
      where: { id },
    });

    if (!existingCredential) {
      res.status(404).json({
        success: false,
        message: "Database credentials not found",
      });
      return;
    }

    const updatedCredentials = await prisma.databaseCredential.update({
      where: { id },
      data: {
        host,
        port,
        database,
        username,
        password,
        ssl: ssl ?? false,
      },
    });

    res.status(200).json({
      success: true,
      message: "Database credentials updated successfully",
      data: updatedCredentials,
    });
  } catch (error) {
    console.error("Error updating database credentials:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
