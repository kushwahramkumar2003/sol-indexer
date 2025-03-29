/*
  Warnings:

  - The values [NFT_SALE] on the enum `IndexingCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "IndexingCategory_new" AS ENUM ('NFT_BIDS', 'NFT_PRICES', 'TOKEN_BORROW', 'TOKEN_PRICES', 'TRANSACTIONS');
ALTER TABLE "indexing_configurations" ALTER COLUMN "categories" TYPE "IndexingCategory_new"[] USING ("categories"::text::"IndexingCategory_new"[]);
ALTER TYPE "IndexingCategory" RENAME TO "IndexingCategory_old";
ALTER TYPE "IndexingCategory_new" RENAME TO "IndexingCategory";
DROP TYPE "IndexingCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "data_sync_logs" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
