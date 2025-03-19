// src/kafka/consumer.ts

import { config, type RawEvent } from "../config";
import { WorkerPool } from "../processing/worker-pool";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { type Consumer, type EachMessagePayload, Kafka } from "kafkajs";

export async function setupConsumer(
  kafka: Kafka,
  workerPool: WorkerPool
): Promise<Consumer> {
  const consumer = kafka.consumer({
    groupId: config.kafka.consumerGroupId,
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
  });

  await consumer.connect();
  logger.info("Kafka consumer connected");

  await consumer.subscribe({
    topic: config.kafka.inputTopic,
    fromBeginning: false,
  });
  logger.info(`Subscribed to topic: ${config.kafka.inputTopic}`);

  await consumer.run({
    partitionsConsumedConcurrently: config.processing.workerCount,
    eachMessage: async (payload: EachMessagePayload) => {
      const { topic, partition, message } = payload;
      const messageId = uuidv4();
      const timestamp = message.timestamp
        ? new Date(parseInt(message.timestamp)).toISOString()
        : new Date().toISOString();

      try {
        logger.debug("Received message", {
          messageId,
          topic,
          partition,
          offset: message.offset,
          timestamp,
        });

        if (!message.value) {
          logger.warn("Empty message received, skipping", { messageId });
          return;
        }

        const rawMessage = message.value.toString();
        const eventData = JSON.parse(rawMessage) as RawEvent;

        // Submit to worker pool for processing
        await workerPool.processEvent(eventData, messageId);
      } catch (error) {
        logger.error("Error processing message", {
          messageId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Handle error and potentially send to DLQ
        if (message.value) {
          await workerPool.handleFailedEvent(
            message.value.toString(),
            error as Error
          );
        }
      }
    },
  });

  return consumer;
}
