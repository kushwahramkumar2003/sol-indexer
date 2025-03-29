import { z } from "zod";
import { IndexingCategory, BlockchainNetwork } from "@prisma/client";

export const indexingConfigSchema = z.object({
  name: z.string().min(3).max(100),
  categories: z.array(z.nativeEnum(IndexingCategory)).min(1),
  network: z.nativeEnum(BlockchainNetwork).default("SOLANA_MAINNET"),
  enabled: z.boolean().default(true),
  credentialId: z.string(),
});
