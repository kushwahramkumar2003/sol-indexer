use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessedEvent {
    #[serde(default = "generate_uuid")] 
    pub id: String,
    #[serde(rename = "configId")]
    pub config_id: String,
    #[serde(rename = "eventType")]
    pub event_type: EventType,
    pub network: String,
    #[serde(rename = "processedData")]
    pub processed_data: serde_json::Value,
    pub metadata: Metadata,
    pub credentials: DatabaseCredential,
}

fn generate_uuid() -> String {
    Uuid::new_v4().to_string()
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EventType {
    NftBids,
    NftPrices,
    TokenBorrow,
    TokenPrices,
    Transactions,
    #[serde(other)] 
    Unknown,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Metadata {
    #[serde(rename = "processorVersion")]
    pub processor_version: String,
    #[serde(rename = "processedAt")]
    pub processed_at: String,
    #[serde(rename = "originalEventId")]
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
