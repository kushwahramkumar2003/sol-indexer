// src/processing/processors/nft-processor.ts
import { PrismaClient, IndexingCategory, TokenStandard } from "@prisma/client";
import { MetricsService } from "../../services/metrics";
import type { RawEvent } from "../../config";
import { logger } from "../../utils/logger";

export class NftProcessor {
  private prisma: PrismaClient;
  private metrics: MetricsService;

  constructor(prisma: PrismaClient, metrics: MetricsService) {
    this.prisma = prisma;
    this.metrics = metrics;
  }

  async process(event: RawEvent): Promise<Record<string, any>> {
    const startTime = Date.now();
    logger.debug("Processing NFT event", {
      eventType: event.eventType,
      mintAddress: event.data.mintAddress,
    });

    try {
      let result: Record<string, any>;

      if (event.eventType === IndexingCategory.NFT_BIDS) {
        result = await this.processBid(event);
      } else if (event.eventType === IndexingCategory.NFT_PRICES) {
        result = await this.processPrice(event);
      } else {
        throw new Error(`Unsupported NFT event type: ${event.eventType}`);
      }

      const duration = Date.now() - startTime;
      this.metrics.observeHistogram("db_query_duration_ms", duration, {
        operation: `nft_${event.eventType.toLowerCase()}`,
      });

      return result;
    } catch (error) {
      logger.error("Error processing NFT event", {
        eventType: event.eventType,
        mintAddress: event.data.mintAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async processBid(event: RawEvent): Promise<Record<string, any>> {
    const { mintAddress, bidAmount, bidder } = event.data;

    // Find or create NFT
    const nft = await this.findOrCreateNft(mintAddress, event.configId);

    // Create market data for bid
    const marketData = await this.prisma.marketData.create({
      data: {
        configId: event.configId,
        nftId: nft.id,
        type: "BID",
        price: bidAmount,
        quantity: 1,
        ownerAddress: bidder,
        expiry: event.data.expiry ? new Date(event.data.expiry) : null,
      },
    });

    return {
      nftId: nft.id,
      marketDataId: marketData.id,
      bidAmount,
      bidder,
      timestamp: new Date(),
    };
  }

  private async processPrice(event: RawEvent): Promise<Record<string, any>> {
    const { mintAddress, price, marketplace, seller } = event.data;

    // Find or create NFT
    const nft = await this.findOrCreateNft(mintAddress, event.configId);

    // Update NFT price
    await this.prisma.nFT.update({
      where: { id: nft.id },
      data: { currentPrice: price, lastUpdated: new Date() },
    });

    // Create market data for price
    const marketData = await this.prisma.marketData.create({
      data: {
        configId: event.configId,
        nftId: nft.id,
        type: "ASK",
        price,
        quantity: 1,
        ownerAddress: seller,
        expiry: event.data.expiry ? new Date(event.data.expiry) : null,
      },
    });

    return {
      nftId: nft.id,
      marketDataId: marketData.id,
      price,
      marketplace,
      seller,
      timestamp: new Date(),
    };
  }

  private async findOrCreateNft(mintAddress: string, configId: string) {
    try {
      const existingNft = await this.prisma.nFT.findFirst({
        where: {
          mintAddress,
          configId,
        },
      });

      if (existingNft) {
        return existingNft;
      }

      return this.prisma.nFT.create({
        data: {
          configId,
          mintAddress,
          ownerAddress: "", // Will be updated with actual data
          standard: TokenStandard.NFT,
          lastUpdated: new Date(),
        },
      });
    } catch (error) {
      logger.error("Error finding or creating NFT", {
        mintAddress,
        configId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
