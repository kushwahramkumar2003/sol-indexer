import express, { type Request, type Response } from "express";
import { kafkaProducer } from "./kafka/producer";
import { logger } from "./utils/logger";
import { config } from "./config";
import { webhookRouter } from "./routes/webhook.route";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

app.use("/webhook", webhookRouter);

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.listen(config.port, async () => {
  await kafkaProducer.connect();
  logger.info(`Server running on port ${config.port}`);
});

process.on("SIGTERM", async () => {
  await kafkaProducer.disconnect();
  process.exit(0);
});
