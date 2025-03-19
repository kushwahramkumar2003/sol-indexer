// routes/webhook.routes.ts
import express from "express";
import { authenticate } from "../middleware/auth";
import {
  createWebhook,
  listWebhooks,
  deleteWebhook,
  handleWebhook,
} from "../controllers/webhook.controller";

const router = express.Router();

// Management routes (require authentication)
router.post("/register", authenticate, createWebhook);
router.get("/list", authenticate, listWebhooks);
router.delete("/:id", authenticate, deleteWebhook);

// Webhook receiver route (public)
router.post("/:webhookPath", handleWebhook);

export const webhookRouter = router;
