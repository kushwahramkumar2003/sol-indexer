-- Migration to create event-type-specific tables for user databases

-- NFT_BIDS table
CREATE TABLE IF NOT EXISTS nft_bids (
    id TEXT PRIMARY KEY,
    config_id TEXT NOT NULL,
    network TEXT NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    original_event_id TEXT NOT NULL,
    bid_amount DECIMAL NOT NULL,          -- Extracted from processed_data
    bidder TEXT NOT NULL,                 -- Extracted from processed_data
    nft_mint TEXT NOT NULL,               -- Extracted from processed_data
    processed_data JSONB NOT NULL         -- Full processed_data for flexibility
);

-- NFT_PRICES table
CREATE TABLE IF NOT EXISTS nft_prices (
    id TEXT PRIMARY KEY,
    config_id TEXT NOT NULL,
    network TEXT NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    original_event_id TEXT NOT NULL,
    price DECIMAL NOT NULL,               -- Extracted from processed_data
    marketplace TEXT NOT NULL,            -- Extracted from processed_data
    nft_mint TEXT NOT NULL,               -- Extracted from processed_data
    processed_data JSONB NOT NULL         -- Full processed_data
);

-- TOKEN_BORROW table
CREATE TABLE IF NOT EXISTS token_borrow (
    id TEXT PRIMARY KEY,
    config_id TEXT NOT NULL,
    network TEXT NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    original_event_id TEXT NOT NULL,
    borrow_amount DECIMAL NOT NULL,       -- Extracted from processed_data
    borrower TEXT NOT NULL,               -- Extracted from processed_data
    token_mint TEXT NOT NULL,             -- Extracted from processed_data
    processed_data JSONB NOT NULL         -- Full processed_data
);

-- TOKEN_PRICES table
CREATE TABLE IF NOT EXISTS token_prices (
    id TEXT PRIMARY KEY,
    config_id TEXT NOT NULL,
    network TEXT NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    original_event_id TEXT NOT NULL,
    price DECIMAL NOT NULL,               -- Extracted from processed_data
    currency_pair TEXT NOT NULL,          -- Extracted from processed_data
    token_mint TEXT NOT NULL,             -- Extracted from processed_data
    processed_data JSONB NOT NULL         -- Full processed_data
);

-- TRANSACTIONS table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    config_id TEXT NOT NULL,
    network TEXT NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    original_event_id TEXT NOT NULL,
    tx_hash TEXT NOT NULL,                -- Extracted from processed_data
    block_number BIGINT,                  -- Extracted from processed_data
    fee DECIMAL NOT NULL,                 -- Extracted from processed_data
    success BOOLEAN NOT NULL,             -- Extracted from processed_data
    processed_data JSONB NOT NULL         -- Full processed_data
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_nft_bids_config_id ON nft_bids (config_id);
CREATE INDEX IF NOT EXISTS idx_nft_prices_config_id ON nft_prices (config_id);
CREATE INDEX IF NOT EXISTS idx_token_borrow_config_id ON token_borrow (config_id);
CREATE INDEX IF NOT EXISTS idx_token_prices_config_id ON token_prices (config_id);
CREATE INDEX IF NOT EXISTS idx_transactions_config_id ON transactions (config_id);

CREATE INDEX IF NOT EXISTS idx_nft_bids_processed_at ON nft_bids (processed_at);
CREATE INDEX IF NOT EXISTS idx_nft_prices_processed_at ON nft_prices (processed_at);
CREATE INDEX IF NOT EXISTS idx_token_borrow_processed_at ON token_borrow (processed_at);
CREATE INDEX IF NOT EXISTS idx_token_prices_processed_at ON token_prices (processed_at);
CREATE INDEX IF NOT EXISTS idx_transactions_processed_at ON transactions (processed_at);