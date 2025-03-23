import {
  PrismaClient,
} from "@prisma/client";
import type { Producer } from "kafkajs";
import { Processor } from "./processor";
import { MetricsService } from "../services/metrics";
import { sendToDLQ } from "../kafka/producer";
import { logger } from "../utils/logger";
import type { RawEvent } from "../config";
import { ConfigCache } from "../services/config-cache";

interface WorkerPoolOptions {
  prisma: PrismaClient;
  producer: Producer;
  metrics: MetricsService;
  size: number;
}

export class WorkerPool {
  private prisma: PrismaClient;
  private producer: Producer;
  private metrics: MetricsService;
  private size: number;
  private running: boolean = false;
  private processor: Processor;
  private configCache: ConfigCache;

  constructor(options: WorkerPoolOptions) {
    this.prisma = options.prisma;
    this.producer = options.producer;
    this.metrics = options.metrics;
    this.size = options.size;
    this.configCache = new ConfigCache(this.prisma);
    this.processor = new Processor({
      prisma: this.prisma,
      producer: this.producer,
      metrics: this.metrics,
      configCache: this.configCache,
    });
  }

  async start(): Promise<void> {
    this.running = true;
    logger.info(`Starting worker pool with ${this.size} workers`);

 
    const { setMetricsService } = await import("../kafka/producer");
    setMetricsService(this.metrics);
  }

  async stop(): Promise<void> {
    this.running = false;
    logger.info("Stopping worker pool");
  }

  async processEvent(rawEvent: RawEvent, messageId: string): Promise<void> {
    if (!this.running) {
      throw new Error("Worker pool is not running");
    }

    const startTime = Date.now();
    try {
      this.metrics.incrementCounter("events_received_total", {
        event_type: rawEvent.eventType,
      });

      logger.info("Processing event", {
        messageId,
        configId: rawEvent.configId,
        eventType: rawEvent.eventType,
      });

      console.log("raw event", rawEvent);

 
      await this.processor.process(rawEvent, messageId);

      const processingTime = Date.now() - startTime;
      this.metrics.observeHistogram(
        "event_processing_duration_ms",
        processingTime,
        {
          event_type: rawEvent.eventType,
        }
      );
      this.metrics.incrementCounter("events_processed_total", {
        event_type: rawEvent.eventType,
        status: "success",
      });

      logger.info("Event processed successfully", {
        messageId,
        processingTimeMs: processingTime,
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.metrics.observeHistogram(
        "event_processing_duration_ms",
        processingTime,
        {
          event_type: rawEvent.eventType,
        }
      );
      this.metrics.incrementCounter("events_processed_total", {
        event_type: rawEvent.eventType,
        status: "failure",
      });

      logger.error("Failed to process event", {
        messageId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        configId: rawEvent.configId,
      });

      throw error;
    }
  }

  async handleFailedEvent(rawMessage: string, error: Error): Promise<void> {
    await sendToDLQ(this.producer, rawMessage, error);
  }
}
