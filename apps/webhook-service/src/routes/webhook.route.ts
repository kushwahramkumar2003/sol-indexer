import express from "express";
import { handleWebhook } from "../controllers/webhook.controller";

const router = express.Router();

router.post("/:webhookPath", handleWebhook);

export const webhookRouter = router;
