import { z } from "zod";
import { BlockchainNetwork } from "@prisma/client";
import os from "os";

const configSchema = z.object({
  env: z.enum(["development", "production", "test"]),
  kafka: z.object({
    clientId: z.string(),
    brokers: z.array(z.string()),
    consumerGroupId: z.string(),
    inputTopic: z.string(),
    outputTopic: z.string(),
    dlqTopic: z.string(), // Dead letter queue
    commitInterval: z.number(),
    messageTimeout: z.number(),
    username: z.string(),
    password: z.string(),
    ca_path: z.string(),
  }),
  processing: z.object({
    workerCount: z.number().int().positive(),
    batchSize: z.number().int().positive(),
    maxRetries: z.number().int().nonnegative(),
    retryBackoffMs: z.number().int().positive(),
    configCacheTtlMs: z.number().int().positive(),
  }),
  database: z.object({
    connectionPoolSize: z.number().int().positive(),
  }),
  metrics: z.object({
    port: z.number().int().positive(),
  }),
  log: z.object({
    level: z.enum(["debug", "info", "warn", "error"]),
  }),
});

// Load and validate configuration
export const config = configSchema.parse({
  env: process.env.NODE_ENV || "development",
  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID || "blockchain-data-processor",
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    consumerGroupId: process.env.KAFKA_CONSUMER_GROUP_ID || "sol-indexer-group",
    inputTopic: process.env.KAFKA_INPUT_TOPIC || "webhook-events",
    outputTopic: process.env.KAFKA_OUTPUT_TOPIC || "processed-events",
    dlqTopic: process.env.KAFKA_DLQ_TOPIC || "dead-letter-queue",
    commitInterval: parseInt(process.env.KAFKA_COMMIT_INTERVAL || "5000", 10),
    messageTimeout: parseInt(process.env.KAFKA_MESSAGE_TIMEOUT || "30000", 10),
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
    mechanism: process.env.KAFKA_MECHANISM,
    ca_path: process.env.CA_CIRT_PATH,
  },
  processing: {
    workerCount: parseInt(
      process.env.PROCESSING_WORKER_COUNT || os.cpus().length.toString() || "10"
    ),
    batchSize: parseInt(process.env.PROCESSING_BATCH_SIZE || "100", 10),
    maxRetries: parseInt(process.env.PROCESSING_MAX_RETRIES || "3", 10),
    retryBackoffMs: parseInt(
      process.env.PROCESSING_RETRY_BACKOFF_MS || "1000",
      10
    ),
    configCacheTtlMs: parseInt(process.env.CONFIG_CACHE_TTL_MS || "60000", 10), // 1 minute
  },
  database: {
    connectionPoolSize: parseInt(process.env.DB_POOL_SIZE || "10", 10),
  },
  metrics: {
    port: parseInt(process.env.METRICS_PORT || "9464", 10),
  },
  log: {
    level: (process.env.LOG_LEVEL || "info") as
      | "debug"
      | "info"
      | "warn"
      | "error",
  },
});


export interface RawEvent {
  configId: string;
  eventType: string;
  network: BlockchainNetwork;
  data: Record<string, any>;
  credentials: {
    id: string;
    userId: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
  };
}


export interface ProcessedEvent {
  id: string;
  configId: string;
  eventType: string;
  network: BlockchainNetwork;
  processedData: Record<string, any>;
  credentials: {
    id: string;
    userId: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
  };
  metadata: {
    processorVersion: string;
    processedAt: Date;
    originalEventId?: string;
  };
}


export function isValidEventType(type: string): boolean {
  return [
    "NFT_BIDS",
    "NFT_PRICES",
    "TOKEN_BORROW",
    "TOKEN_PRICES",
    "TRANSACTIONS",
    "TRANSFER",
    "NFT_SALE",
  ].includes(type);
}
