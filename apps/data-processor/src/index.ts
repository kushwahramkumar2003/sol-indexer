// src/index.ts - Main entry point
import { Kafka, logLevel } from "kafkajs";

import { config } from "./config";
import { setupConsumer } from "./kafka/consumer";
import { setupProducer } from "./kafka/producer";
import { WorkerPool } from "./processing/worker-pool";
import { MetricsService } from "./services/metrics";
import prisma from "db/client";
import { logger } from "./utils/logger";

async function main() {
  logger.info("Starting data processor service...");

  await prisma.$connect();
  logger.info("Connected to database");

  // Initialize Kafka
  const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
    logLevel: logLevel.ERROR,
    retry: {
      initialRetryTime: 300,
      retries: 10,
      maxRetryTime: 30000,
    },
  });

  // Initialize metrics
  const metrics = new MetricsService();
  metrics.startServer(config.metrics.port);
  logger.info(`Metrics server started on port ${config.metrics.port}`);

  // Initialize producer
  const producer = await setupProducer(kafka);
  logger.info("Kafka producer initialized");

  // Initialize worker pool
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

  // Initialize consumer
  const consumer = await setupConsumer(kafka, workerPool);
  logger.info("Kafka consumer initialized");

  // Handle graceful shutdown
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
