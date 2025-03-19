import type { Request, Response, NextFunction } from "express";
import { WebhookPayloadSchema } from "../validators/webhook.validator";
import { log } from "../utils/logger";
import * as z from "zod";
declare global {
  namespace Express {
    interface Request {
      validatedData?: z.infer<typeof WebhookPayloadSchema>;
    }
  }
}

export function validate(schema: typeof WebhookPayloadSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        log.warn("Validation failed:", result.error.format());
        return res.status(400).json({
          error: "Invalid payload",
          details: result.error.flatten(),
        });
      }

      req.validatedData = result.data;
      next();
    } catch (error) {
      log.error("Validation error:", error as Error);
      res.status(500).json({ error: "Validation failed" });
    }
  };
}
