// src/processing/processors/token-processor.ts
import { PrismaClient, IndexingCategory } from "@prisma/client";
import { MetricsService } from "../../services/metrics";
import type { RawEvent } from "../../config";
import { logger } from "../../utils/logger";

export class TokenProcessor {
  private prisma: PrismaClient;
  private metrics: MetricsService;

  constructor(prisma: PrismaClient, metrics: MetricsService) {
    this.prisma = prisma;
    this.metrics = metrics;
  }

  async process(event: RawEvent): Promise<Record<string, any>> {
    const startTime = Date.now();
    logger.debug("Processing token event", {
      eventType: event.eventType,
      mintAddress: event.data.mintAddress,
    });

    try {
      let result: Record<string, any>;

      if (event.eventType === IndexingCategory.TOKEN_BORROW) {
        result = await this.processBorrow(event);
      } else if (event.eventType === IndexingCategory.TOKEN_PRICES) {
        result = await this.processPrice(event);
      } else {
        throw new Error(`Unsupported token event type: ${event.eventType}`);
      }

      const duration = Date.now() - startTime;
      this.metrics.observeHistogram("db_query_duration_ms", duration, {
        operation: `token_${event.eventType.toLowerCase()}`,
      });

      return result;
    } catch (error) {
      logger.error("Error processing token event", {
        eventType: event.eventType,
        mintAddress: event.data.mintAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async processBorrow(event: RawEvent): Promise<Record<string, any>> {
    const { mintAddress, borrowAmount, borrower, interestRate } = event.data;

    // Find or create token
    const token = await this.findOrCreateToken(
      mintAddress,
      event.configId,
      undefined,
      event.data
    );

    // Create market data for borrow
    const marketData = await this.prisma.marketData.create({
      data: {
        configId: event.configId,
        tokenId: token.id,
        type: "LOAN",
        price: interestRate || 0,
        quantity: borrowAmount,
        ownerAddress: borrower,
        expiry: event.data.expiry ? new Date(event.data.expiry) : null,
      },
    });

    return {
      tokenId: token.id,
      marketDataId: marketData.id,
      borrowAmount,
      borrower,
      interestRate,
      timestamp: new Date(),
    };
  }

  private async processPrice(event: RawEvent): Promise<Record<string, any>> {
    const { mintAddress, price, currencyPair, volume } = event.data;

    // Find or create token
    const token = await this.findOrCreateToken(
      mintAddress,
      event.configId,
      price,
      event.data
    );

    return {
      tokenId: token.id,
      price,
      currencyPair,
      volume,
      timestamp: new Date(),
    };
  }
  private async findOrCreateToken(
    mintAddress: string,
    configId: string,
    price?: number,
    eventData?: any
  ) {
    {
      try {
        const existingToken = await this.prisma.token.findFirst({
          where: {
            mintAddress,
            configId,
          },
        });

        if (existingToken) {
          // Update price if provided
          if (price !== undefined) {
            return this.prisma.token.update({
              where: { id: existingToken.id },
              data: {
                price,
                lastUpdated: new Date(),
              },
            });
          }
          return existingToken;
        }

        return this.prisma.token.create({
          data: {
            mintAddress,
            config: { connect: { id: configId } },
            name: eventData?.name || "Unknown Token",
            symbol: eventData?.symbol || "UNKNOWN",
            decimals: eventData?.decimals || 9,
            price: price || 0,
            platform: eventData?.platform || "Unknown",
            lastUpdated: new Date(),
          },
        });
      } catch (error) {
        logger.error("Error finding or creating token", {
          mintAddress,
          configId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }
}
