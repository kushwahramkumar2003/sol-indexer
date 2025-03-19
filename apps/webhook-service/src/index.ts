// index.ts
import express from "express";
import { kafkaProducer } from "./kafka/producer";
import { log } from "./utils/logger";
import { config } from "./config";
import { webhookRouter } from "./routes/webhook.route";

const app = express();
app.use(express.json());

// Routes
app.use("/webhook", webhookRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Startup
app.listen(config.port, async () => {
  await kafkaProducer.connect();
  log.info(`Server running on port ${config.port}`);
});

// Cleanup
process.on("SIGTERM", async () => {
  await kafkaProducer.disconnect();
  process.exit(0);
});
