// routes/webhook.routes.ts
import express from "express";
import {

  deleteWebhook,
  listWebhooks,
} from "../controllers/webhook";

const router = express.Router();

router.get("/list", listWebhooks);
router.delete("/:id", deleteWebhook);

export default router;
