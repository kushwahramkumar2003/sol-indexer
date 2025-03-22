// config/index.ts
import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000"),
  encryptionKey: process.env.ENCRYPTION_KEY!,
  env: process.env.NODE_ENV || "development",
  webhookSecret: process.env.WEBHOOK_SECRET || "whsec_12345",
  apiBaseUrl:
    process.env.API_BASE_URL ||
    `http://localhost:${process.env.PORT || "3000"}`,
};

// Validate required environment variables
const requiredVars = ["ENCRYPTION_KEY"];
requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
