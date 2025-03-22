// routes/webhook.routes.ts
import express from "express";
import {
  createWebhook,
  deleteWebhook,
  listWebhooks,
} from "../controllers/webhook";

const router = express.Router();

router.post("/register", createWebhook);
router.get("/list", listWebhooks);
router.delete("/:id", deleteWebhook);

export default router;
