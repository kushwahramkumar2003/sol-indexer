-- Add migration script here
-- Initial schema for user databases
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    config_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    network TEXT NOT NULL,
    processed_data JSONB NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    original_event_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_config_id ON events (config_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events (event_type);