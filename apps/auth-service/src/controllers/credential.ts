import prisma from "db/client";
import type { Request, Response } from "express";

export const addDatabaseCredentials = async (req: Request, res: Response) => {
  try {
    const { userId, host, port, database, username, password, ssl } = req.body;
    if (
      !userId ||
      !host ||
      !port ||
      !database ||
      !username ||
      !password ||
      !ssl
    ) {
      return res.status(400).send("All fields are required");
    }
    const dbCredentials = await prisma.databaseCredential.create({
      data: {
        userId,
        host,
        port,
        database,
        username,
        password,
        ssl,
      },
    });
    return res.status(201).json(dbCredentials);
  } catch (error) {
    return res.status(500).send("Something went wrong");
  }
};

export const getDatabaseCredentialsById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.query.id as string;
    if (!id) {
      return res.status(400).send("ID is required");
    }
    const dbCredentials = await prisma.databaseCredential.findUnique({
      where: {
        id,
      },
    });
    return res.status(200).json(dbCredentials);
  } catch (error) {
    return res.status(500).send("Something went wrong");
  }
};

export const getDatabaseCredentials = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).send("User ID is required");
    }
    const dbCredentials = await prisma.databaseCredential.findMany({
      where: {
        userId,
      },
    });
    return res.status(200).json(dbCredentials);
  } catch (error) {
    return res.status(500).send("Something went wrong");
  }
};

export const deleteDatabaseCredentials = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.query.id as string;
    if (!id) {
      return res.status(400).send("ID is required");
    }
    await prisma.databaseCredential.delete({
      where: {
        id,
      },
    });
    return res.status(200).send("Database credentials deleted");
  } catch (error) {
    return res.status(500).send("Something went wrong");
  }
};

export const updateDatabaseCredentials = async (
  req: Request,
  res: Response
) => {
  try {
    const { id, host, port, database, username, password, ssl } = req.body;
    if (!id || !host || !port || !database || !username || !password || !ssl) {
      return res.status(400).send("All fields are required");
    }
    await prisma.databaseCredential.update({
      where: {
        id,
      },
      data: {
        host,
        port,
        database,
        username,
        password,
        ssl,
      },
    });
    return res.status(200).send("Database credentials updated");
  } catch (error) {
    return res.status(500).send("Something went wrong");
  }
};
