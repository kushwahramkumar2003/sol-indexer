// validators/webhook.validator.ts
import { z } from "zod";

// Webhook creation validator
export const CreateWebhookSchema = z.object({
  configurationId: z.string().uuid(),
});

// Helius webhook payload validators
export const BaseTransactionSchema = z.object({
  txHash: z.string().regex(/^[0-9a-fA-F]{64}$/),
  blockNumber: z.number().int().positive(),
  timestamp: z.union([z.string().datetime(), z.date()]),
  accounts: z.array(z.string()).optional(),
  logs: z.array(z.string()).optional(),
});

export const NftBidSchema = z.object({
  mintAddress: z.string(),
  bidAmount: z.number().positive(),
  bidder: z.string(),
  currency: z.string(),
  marketplace: z.string().optional(),
  expiry: z.union([z.string().datetime(), z.date()]).optional(),
});

export const NftPriceSchema = z.object({
  mintAddress: z.string(),
  price: z.number().positive(),
  seller: z.string().optional(),
  marketplace: z.string(),
  currency: z.string().optional(),
});

export const TokenBorrowSchema = z.object({
  mintAddress: z.string(),
  borrowAmount: z.number().positive(),
  borrower: z.string(),
  platform: z.string(),
  interestRate: z.number().optional(),
  collateralAmount: z.number().optional(),
  collateralMint: z.string().optional(),
});

export const TokenPriceSchema = z.object({
  mintAddress: z.string(),
  price: z.number().positive(),
  currencyPair: z.string(),
  source: z.string(),
  volume24h: z.number().optional(),
  changePercent24h: z.number().optional(),
});

// For validation of webhook payloads, we can use discriminated unions or other techniques
// depending on the actual payloads from Helius
export const WebhookPayloadSchema = z.union([
  BaseTransactionSchema,
  NftBidSchema,
  NftPriceSchema,
  TokenBorrowSchema,
  TokenPriceSchema,
]);

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
