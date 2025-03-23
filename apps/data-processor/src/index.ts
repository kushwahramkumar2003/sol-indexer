import { Kafka, logLevel } from "kafkajs";
import fs from "fs";

import { config } from "./config";
import { setupConsumer } from "./kafka/consumer";
import { setupProducer } from "./kafka/producer";
import { WorkerPool } from "./processing/worker-pool";
import { MetricsService } from "./services/metrics";
import prisma from "db/client";
import { logger } from "./utils/logger";

async function main() {
  logger.info("Starting data processor service...");

  const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
    logLevel: logLevel.ERROR,

    retry: {
      initialRetryTime: 300,
      retries: 10,
      maxRetryTime: 30000,
    },
    ssl: {
      ca: [fs.readFileSync(config.kafka.ca_path, "utf-8")],
    },
    sasl:
      config.kafka.username && config.kafka.password
        ? {
            mechanism: "plain",
            username: config.kafka.username,
            password: config.kafka.password,
          }
        : undefined,
  });

  const metrics = new MetricsService();
  metrics.startServer(config.metrics.port);
  logger.info(`Metrics server started on port ${config.metrics.port}`);

  const producer = await setupProducer(kafka);
  logger.info("Kafka producer initialized");

  const workerPool = new WorkerPool({
    prisma,
    producer,
    metrics,
    size: config.processing.workerCount,
  });
  await workerPool.start();
  logger.info(
    `Worker pool started with ${config.processing.workerCount} workers`
  );

  const consumer = await setupConsumer(kafka, workerPool);
  logger.info("Kafka consumer initialized");

  const shutdown = async () => {
    logger.info("Shutting down...");
    await consumer.disconnect();
    await producer.disconnect();
    await workerPool.stop();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  logger.error("Fatal error in data processor service", { error });
  process.exit(1);
});
