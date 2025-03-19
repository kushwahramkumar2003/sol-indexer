// config/index.ts
import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000"),
  kafka: {
    broker: process.env.KAFKA_BROKER!,
    ssl: process.env.KAFKA_SSL === "true",
  },
  encryptionKey: process.env.ENCRYPTION_KEY!,
  database: {
    url: process.env.DATABASE_URL!,
  },
  webhookSecret: process.env.WEBHOOK_SECRET!,
  env: process.env.NODE_ENV || "development",
  apiBaseUrl:
    process.env.API_BASE_URL ||
    `http://localhost:${process.env.PORT || "3000"}`,
};

// Validate required environment variables
const requiredVars = [
  "KAFKA_BROKER",
  "ENCRYPTION_KEY",
  "DATABASE_URL",
  "WEBHOOK_SECRET",
];
requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
