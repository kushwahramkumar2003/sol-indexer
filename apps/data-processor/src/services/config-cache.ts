import { logger } from "../utils/logger";
import { config } from "../config";
import LRU from "lru-cache";
import { PrismaClient } from "@prisma/client";

export class ConfigCache {
  private prisma: PrismaClient;
  private cache: LRU<string, any>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cache = new LRU({
      max: 1000, // Maximum number of cached items
      ttl: config.processing.configCacheTtlMs, // Time to live in milliseconds
    });
  }

  async getConfig(configId: string): Promise<any> {
    // Check cache first
    const cachedConfig = this.cache.get(configId);
    if (cachedConfig) {
      return cachedConfig;
    }

    // Fetch from database
    try {
      const configuration = await this.prisma.indexingConfiguration.findUnique({
        where: { id: configId },
        include: {
          user: {
            include: {
              databaseCredentials: true,
            },
          },
        },
      });

      if (!configuration) {
        throw new Error(`Configuration with id ${configId} not found`);
      }

      // Store in cache
      this.cache.set(configId, configuration);

      return configuration;
    } catch (error: Error | any) {
      logger.error(`Error fetching configuration ${configId}:`, error);
      throw new Error(`Failed to fetch configuration: ${error.message}`);
    }
  }

  async invalidateCache(configId: string): Promise<void> {
    this.cache.delete(configId);
    logger.debug(`Cache invalidated for configuration ${configId}`);
  }

  async refreshConfig(configId: string): Promise<any> {
    // Force refresh by invalidating cache first
    this.invalidateCache(configId);
    // Then fetch fresh data
    return this.getConfig(configId);
  }
}
