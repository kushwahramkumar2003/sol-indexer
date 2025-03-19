// src/processing/processors/transaction-processor.ts
import { PrismaClient, IndexingCategory } from "@prisma/client";
import { MetricsService } from "../../services/metrics";
import type { RawEvent } from "../../config";
import { logger } from "../../utils/logger";

export class TransactionProcessor {
  private prisma: PrismaClient;
  private metrics: MetricsService;

  constructor(prisma: PrismaClient, metrics: MetricsService) {
    this.prisma = prisma;
    this.metrics = metrics;
  }

  async process(event: RawEvent): Promise<Record<string, any>> {
    const startTime = Date.now();
    const { txHash, blockNumber, timestamp, fee, success, accounts, logs } =
      event.data;

    logger.debug("Processing transaction event", {
      txHash,
      blockNumber,
    });

    try {
      // Create transaction
      const transaction = await this.prisma.transaction.create({
        data: {
          configId: event.configId,
          txHash,
          blockNumber: BigInt(blockNumber),
          timestamp: new Date(timestamp),
          fee: fee || 0,
          success: success !== false, // Default to true if not specified
          accounts: accounts || [],
          logs: logs || [],
        },
      });

      // Process events if provided
      if (event.data.events && Array.isArray(event.data.events)) {
        for (const eventData of event.data.events) {
          await this.prisma.event.create({
            data: {
              transactionId: transaction.id,
              type: eventData.type,
              data: eventData.data,
              timestamp: new Date(eventData.timestamp || timestamp),
            },
          });
        }
      }

      const duration = Date.now() - startTime;
      this.metrics.observeHistogram("db_query_duration_ms", duration, {
        operation: "transaction_processing",
      });

      logger.info("Transaction processed successfully", {
        txHash,
        blockNumber,
        duration,
      });

      return { success: true, transactionId: transaction.id };
    } catch (error) {
      logger.error("Error processing transaction", {
        txHash,
        blockNumber,
        error: error instanceof Error ? error.message : String(error),
      });

      this.metrics.incrementCounter("transaction_processing_errors", {
        configId: event.configId,
      });

      throw error;
    }
  }
}
