// src/processing/processor.ts
import {
  PrismaClient,
  IndexingCategory,
  BlockchainNetwork,
} from "@prisma/client";
import type { Producer } from "kafkajs";
import { v4 as uuidv4 } from "uuid";
import { MetricsService } from "../services/metrics";
import { sendProcessedEvent } from "../kafka/producer";
import { NftProcessor } from "./processors/nft-processor";
import { TokenProcessor } from "./processors/token-processor";
import { TransactionProcessor } from "./processors/transaction-processor";
import type { ConfigCache } from "../services/config-cache";
import {
  isValidEventType,
  type ProcessedEvent,
  type RawEvent,
} from "../config";

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
  private nftProcessor: NftProcessor;
  private tokenProcessor: TokenProcessor;
  private transactionProcessor: TransactionProcessor;
  private readonly VERSION = "1.0.0";

  constructor(options: ProcessorOptions) {
    this.prisma = options.prisma;
    this.producer = options.producer;
    this.metrics = options.metrics;
    this.configCache = options.configCache;

    // Initialize specific processors
    this.nftProcessor = new NftProcessor(this.prisma, this.metrics);
    this.tokenProcessor = new TokenProcessor(this.prisma, this.metrics);
    this.transactionProcessor = new TransactionProcessor(
      this.prisma,
      this.metrics
    );
  }

  async process(rawEvent: RawEvent, messageId: string): Promise<void> {
    // Validate the event
    this.validateEvent(rawEvent);

    // Get the indexing configuration
    const config = await this.configCache.getConfig(rawEvent.configId);
    if (!config) {
      throw new Error(`Configuration not found: ${rawEvent.configId}`);
    }

    if (!config.enabled) {
      throw new Error(`Configuration is disabled: ${rawEvent.configId}`);
    }

    // Check if the configuration supports this event type
    if (!config.categories.includes(rawEvent.eventType as IndexingCategory)) {
      throw new Error(
        `Event type not supported by configuration: ${rawEvent.eventType}`
      );
    }

    // Process based on event type
    let processedData: Record<string, any>;

    switch (rawEvent.eventType as IndexingCategory) {
      case IndexingCategory.NFT_BIDS:
      case IndexingCategory.NFT_PRICES:
        processedData = await this.nftProcessor.process(rawEvent);
        break;
      case IndexingCategory.TOKEN_BORROW:
      case IndexingCategory.TOKEN_PRICES:
        processedData = await this.tokenProcessor.process(rawEvent);
        break;
      case IndexingCategory.TRANSACTIONS:
        processedData = await this.transactionProcessor.process(rawEvent);
        break;
      default:
        throw new Error(`Unsupported event type: ${rawEvent.eventType}`);
    }

    // Create processed event
    const processedEvent: ProcessedEvent = {
      id: uuidv4(),
      configId: rawEvent.configId,
      eventType: rawEvent.eventType,
      network: rawEvent.network,
      processedData,
      metadata: {
        processorVersion: this.VERSION,
        processedAt: new Date(),
        originalEventId: messageId,
      },
    };

    // Send to Kafka
    await sendProcessedEvent(this.producer, processedEvent);

    // Log the processing in the database
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
