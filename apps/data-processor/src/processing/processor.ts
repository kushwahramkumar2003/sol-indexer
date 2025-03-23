import {
  PrismaClient,
  IndexingCategory,
  BlockchainNetwork,
} from "@prisma/client";
import type { Producer } from "kafkajs";
import { v4 as uuidv4 } from "uuid";
import { MetricsService } from "../services/metrics";
import { sendProcessedEvent } from "../kafka/producer";
import type { ConfigCache } from "../services/config-cache";
import {
  isValidEventType,
  type ProcessedEvent,
  type RawEvent,
} from "../config";
import { parseEventData, type HeliusTransaction } from "parser";

interface ProcessorOptions {
  prisma: PrismaClient;
  producer: Producer;
  metrics: MetricsService;
  configCache: ConfigCache;
}

export class Processor {
  private prisma: PrismaClient;
  private producer: Producer;
  private metrics: MetricsService;
  private configCache: ConfigCache;
  private readonly VERSION = "1.0.0";

  constructor(options: ProcessorOptions) {
    this.prisma = options.prisma;
    this.producer = options.producer;
    this.metrics = options.metrics;
    this.configCache = options.configCache;
  }

  async process(rawEvent: RawEvent, messageId: string): Promise<void> {
    this.validateEvent(rawEvent);

    const config = await this.configCache.getConfig(rawEvent.configId);
    if (!config) {
      throw new Error(`Configuration not found: ${rawEvent.configId}`);
    }

    if (!config.enabled) {
      throw new Error(`Configuration is disabled: ${rawEvent.configId}`);
    }

    if (!config.categories.includes(rawEvent.eventType as IndexingCategory)) {
      throw new Error(
        `Event type not supported by configuration: ${rawEvent.eventType}`
      );
    }

    // logger.info("Processing event", {
    //   configId: rawEvent.configId,
    //   eventType: rawEvent.eventType,
    //   network: rawEvent.network,
    // });

    console.log("raw event data", rawEvent.data);

    const parsedData = parseEventData(rawEvent.data as HeliusTransaction);

    // console.log("parsed data", parsedData);

    const processedEvent: ProcessedEvent = {
      id: uuidv4(),
      configId: rawEvent.configId,
      eventType: rawEvent.eventType,
      network: rawEvent.network,
      processedData: parsedData,
      credentials: rawEvent.credentials,
      metadata: {
        processorVersion: this.VERSION,
        processedAt: new Date(),
        originalEventId: messageId,
      },
    };

    // console.log("processed event", processedEvent);

    await sendProcessedEvent(this.producer, processedEvent);

    await this.prisma.dataSyncLog.create({
      data: {
        configId: rawEvent.configId,
        startTime: new Date(),
        endTime: new Date(),
        itemsSynced: 1,
        success: true,
      },
    });
  }

  private validateEvent(event: RawEvent): void {
    if (!event.configId) {
      throw new Error("Missing configId in event");
    }

    console.log("event type", event.eventType);

    if (!event.eventType || !isValidEventType(event.eventType)) {
      throw new Error(`Invalid event type: ${event.eventType}`);
    }

    if (
      !event.network ||
      !Object.values(BlockchainNetwork).includes(
        event.network as BlockchainNetwork
      )
    ) {
      throw new Error(`Invalid network: ${event.network}`);
    }

    if (!event.data || typeof event.data !== "object") {
      throw new Error("Invalid event data");
    }

    if (!event.credentials) {
      throw new Error("Missing database credentials in event");
    }
  }
}
