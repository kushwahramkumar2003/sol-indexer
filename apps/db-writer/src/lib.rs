use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessedEvent {
    pub id: String,
    pub config_id: String,
    pub event_type: String,
    pub network: String,
    pub processed_data: serde_json::Value,
    pub metadata: Metadata,
    pub credentials: DatabaseCredential, // Included in Kafka message
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Metadata {
    pub processor_version: String,
    pub processed_at: String,
    pub original_event_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseCredential {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
    pub ssl: bool,
}

pub struct DbPool {
    pub pool: PgPool,
    pub schema_version: String,
}
