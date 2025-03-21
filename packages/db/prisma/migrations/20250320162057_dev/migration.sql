-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SERVICE');

-- CreateEnum
CREATE TYPE "IndexingCategory" AS ENUM ('NFT_BIDS', 'NFT_PRICES', 'TOKEN_BORROW', 'TOKEN_PRICES', 'TRANSACTIONS');

-- CreateEnum
CREATE TYPE "BlockchainNetwork" AS ENUM ('SOLANA_MAINNET', 'SOLANA_DEVNET');

-- CreateEnum
CREATE TYPE "TokenStandard" AS ENUM ('SPL', 'SPL_ASSOCIATED_TOKEN', 'NFT', 'NFT_COLLECTION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" "Role"[] DEFAULT ARRAY['USER']::"Role"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "database_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "host" VARCHAR(255) NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 5432,
    "database" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "ssl" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "database_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexing_configurations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categories" "IndexingCategory"[],
    "network" "BlockchainNetwork" NOT NULL DEFAULT 'SOLANA_MAINNET',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexing_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "txHash" VARCHAR(255) NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL,
    "accounts" TEXT[],
    "logs" TEXT[],

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfts" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "mintAddress" VARCHAR(255) NOT NULL,
    "ownerAddress" VARCHAR(255) NOT NULL,
    "metadataUri" TEXT,
    "name" TEXT,
    "symbol" TEXT,
    "standard" "TokenStandard" NOT NULL,
    "attributes" JSONB,
    "currentPrice" DECIMAL(65,30),
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nfts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "mintAddress" VARCHAR(255) NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "platform" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_data" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "nftId" TEXT,
    "tokenId" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "expiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sync_logs" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "itemsSynced" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,

    CONSTRAINT "data_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "level" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_registrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "webhookPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "database_credentials_userId_host_database_key" ON "database_credentials"("userId", "host", "database");

-- CreateIndex
CREATE INDEX "indexing_configurations_userId_idx" ON "indexing_configurations"("userId");

-- CreateIndex
CREATE INDEX "transactions_txHash_idx" ON "transactions"("txHash");

-- CreateIndex
CREATE INDEX "transactions_blockNumber_idx" ON "transactions"("blockNumber");

-- CreateIndex
CREATE INDEX "transactions_timestamp_idx" ON "transactions"("timestamp");

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE INDEX "nfts_mintAddress_idx" ON "nfts"("mintAddress");

-- CreateIndex
CREATE INDEX "nfts_ownerAddress_idx" ON "nfts"("ownerAddress");

-- CreateIndex
CREATE INDEX "tokens_mintAddress_idx" ON "tokens"("mintAddress");

-- CreateIndex
CREATE INDEX "tokens_symbol_idx" ON "tokens"("symbol");

-- CreateIndex
CREATE INDEX "market_data_type_idx" ON "market_data"("type");

-- CreateIndex
CREATE INDEX "market_data_ownerAddress_idx" ON "market_data"("ownerAddress");

-- CreateIndex
CREATE INDEX "data_sync_logs_startTime_idx" ON "data_sync_logs"("startTime");

-- CreateIndex
CREATE INDEX "system_logs_level_idx" ON "system_logs"("level");

-- CreateIndex
CREATE INDEX "system_logs_timestamp_idx" ON "system_logs"("timestamp");

-- CreateIndex
CREATE INDEX "alerts_userId_idx" ON "alerts"("userId");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_registrations_webhookPath_key" ON "webhook_registrations"("webhookPath");

-- CreateIndex
CREATE INDEX "webhook_registrations_userId_idx" ON "webhook_registrations"("userId");

-- CreateIndex
CREATE INDEX "webhook_registrations_webhookPath_idx" ON "webhook_registrations"("webhookPath");

-- AddForeignKey
ALTER TABLE "database_credentials" ADD CONSTRAINT "database_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indexing_configurations" ADD CONSTRAINT "indexing_configurations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_configId_fkey" FOREIGN KEY ("configId") REFERENCES "indexing_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_configId_fkey" FOREIGN KEY ("configId") REFERENCES "indexing_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_configId_fkey" FOREIGN KEY ("configId") REFERENCES "indexing_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_data" ADD CONSTRAINT "market_data_configId_fkey" FOREIGN KEY ("configId") REFERENCES "indexing_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_data" ADD CONSTRAINT "market_data_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "nfts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_data" ADD CONSTRAINT "market_data_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_sync_logs" ADD CONSTRAINT "data_sync_logs_configId_fkey" FOREIGN KEY ("configId") REFERENCES "indexing_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_registrations" ADD CONSTRAINT "webhook_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_registrations" ADD CONSTRAINT "webhook_registrations_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "indexing_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
