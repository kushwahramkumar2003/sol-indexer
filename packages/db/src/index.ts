import { PrismaClient } from "@prisma/client";

/**
 * Validates the DATABASE_URL environment variable
 * to prevent common configuration errors across microservices
 */
function validateDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not defined. Please check your .env file or environment configuration."
    );
  }

  // Check for proper protocol (most common error)
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw new Error(
      "DATABASE_URL must start with postgresql:// or postgres:// protocol. Current value does not have the correct format."
    );
  }

  return url;
}

/**
 * Creates a PrismaClient with proper error handling and connection management
 * for use across multiple microservices in a Turborepo setup
 */
function createPrismaClient() {
  try {
    // Validate DATABASE_URL before creating client
    const databaseUrl = validateDatabaseUrl();

    return new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      errorFormat: "pretty",
    });
  } catch (error) {
    // Provide detailed error information for easier debugging
    console.error("Failed to initialize Prisma Client:");
    console.error(error instanceof Error ? error.message : String(error));

    // In development, show more details about the environment
    if (process.env.NODE_ENV === "development") {
      console.error("Current environment variables:");
      console.error(`- NODE_ENV: ${process.env.NODE_ENV}`);
      console.error(
        `- DATABASE_URL: ${process.env.DATABASE_URL ? "Set (but may be invalid)" : "Not set"}`
      );
      console.error(
        `- Current service: ${process.env.SERVICE_NAME || "unknown"}`
      );
    }

    // Re-throw to prevent application from running with invalid database connection
    throw error;
  }
}

// Create a unique global key for this instance
const PRISMA_CLIENT_KEY = "prisma_client_singleton_v1";

// Create proper type for global object with prisma client
type GlobalWithPrisma = typeof globalThis & {
  [PRISMA_CLIENT_KEY]: PrismaClient | undefined;
};

// Get the global object with proper typing
const globalWithPrisma = globalThis as GlobalWithPrisma;

// Create and export the prisma client
export const prisma =
  globalWithPrisma[PRISMA_CLIENT_KEY] ?? createPrismaClient();

// Store the client in development to support hot reloading
if (process.env.NODE_ENV !== "production") {
  globalWithPrisma[PRISMA_CLIENT_KEY] = prisma;
}

/**
 * Safely disconnects the Prisma client
 * Should be called during microservice shutdown
 */
export const disconnectPrisma = async () => {
  if (globalWithPrisma[PRISMA_CLIENT_KEY]) {
    try {
      await globalWithPrisma[PRISMA_CLIENT_KEY]?.$disconnect();
      console.log("Prisma client disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting Prisma client:", error);
    }
  }
};

// Default export for simpler imports
export default prisma;
