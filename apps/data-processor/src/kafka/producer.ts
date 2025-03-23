// src/kafka/producer.ts
import { Kafka, CompressionTypes, type Producer, type Message } from "kafkajs";
import { config, type ProcessedEvent } from "../config";
import { MetricsService } from "../services/metrics";
import { logger } from "../utils/logger";

let metricsService: MetricsService | null = null;

export function setMetricsService(metrics: MetricsService) {
  metricsService = metrics;
}

export async function setupProducer(kafka: Kafka): Promise<Producer> {
  const producer = kafka.producer({
    allowAutoTopicCreation: true,
    idempotent: true,
  });

  await producer.connect();
  logger.info("Kafka producer connected");
  return producer;
}

export async function sendProcessedEvent(
  producer: Producer,
  event: ProcessedEvent,
  retry = 0
): Promise<void> {
  console.log("sendProcessedEvent", event);
  const maxRetries = config.processing.maxRetries;
  const startTime = Date.now();

  try {
    const message: Message = {
      key: event.configId,
      value: JSON.stringify(event),
      headers: {
        "event-type": event.eventType,
        "processor-version": event.metadata.processorVersion,
      },
    };

    await producer.send({
      // topic: config.kafka.outputTopic,
      topic: "processed-events",
      compression: CompressionTypes.GZIP,
      messages: [message],
    });

    const duration = Date.now() - startTime;
    if (metricsService) {
      metricsService.observeHistogram("kafka_produce_duration_ms", duration, {
        topic: config.kafka.outputTopic,
      });
    }

    logger.debug("Successfully sent processed event to Kafka", {
      eventId: event.id,
      configId: event.configId,
      duration,
    });
  } catch (error) {
    if (retry < maxRetries) {
      const backoff = config.processing.retryBackoffMs * Math.pow(2, retry);
      logger.warn(`Failed to send event, retrying in ${backoff}ms`, {
        eventId: event.id,
        retry: retry + 1,
        maxRetries,
        error: error instanceof Error ? error.message : String(error),
      });

      await new Promise((resolve) => setTimeout(resolve, backoff));
      return sendProcessedEvent(producer, event, retry + 1);
    } else {
      logger.error("Failed to send processed event after max retries", {
        eventId: event.id,
        maxRetries,
        error: error instanceof Error ? error.message : String(error),
      });

      if (metricsService) {
        metricsService.incrementCounter("kafka_producer_errors", {
          topic: config.kafka.outputTopic,
        });
      }

      throw error;
    }
  }
}

export async function sendToDLQ(
  producer: Producer,
  originalMessage: string,
  error: Error
): Promise<void> {
  try {
    // Create DLQ message with error information
    const dlqMessage = {
      originalMessage,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
    };

    await producer.send({
      topic: config.kafka.dlqTopic,
      messages: [
        {
          value: JSON.stringify(dlqMessage),
          headers: {
            "error-type": error.name,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    });

    if (metricsService) {
      metricsService.incrementCounter("events_dlq_total", {
        event_type: error.name || "unknown",
      });
    }

    logger.info("Sent failed message to DLQ", {
      errorType: error.name,
    });
  } catch (dlqError) {
    logger.error("Failed to send message to DLQ", {
      error: dlqError instanceof Error ? dlqError.message : String(dlqError),
      originalError: error.message,
    });

    if (metricsService) {
      metricsService.incrementCounter("kafka_producer_errors", {
        topic: config.kafka.dlqTopic,
      });
    }
  }
}
