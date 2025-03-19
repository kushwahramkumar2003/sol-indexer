import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { log } from "../utils/logger";
import db from "db/client";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; roles: string[] };
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    log.warn("Missing authentication token");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    log.warn("Invalid token");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (!config.encryptionKey) {
      throw new Error("Encryption key is not configured");
    }

    const decoded = jwt.verify(token, config.encryptionKey) as unknown as {
      userId: string;
    };
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, roles: true },
    });

    if (!user) {
      log.warn(`User not found for token: ${token}`);
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    log.error("Authentication failed:", error as Error);
    res.status(401).json({ error: "Invalid token" });
  }
}
