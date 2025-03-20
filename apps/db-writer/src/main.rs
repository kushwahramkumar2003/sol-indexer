use db_writer::{DatabaseCredential, DbPool, ProcessedEvent};
use dotenv::dotenv;
use log::{error, info};
use rdkafka::config::ClientConfig;
use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::Message;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use std::collections::HashMap;
use std::env;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio::time::sleep;

const SCHEMA_VERSION: &str = "20250320072007";
const MAX_RETRIES: u32 = 5;
const BASE_RETRY_DELAY_MS: u64 = 1000;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables from .env file
    dotenv().ok();

    // Initialize logging
    env_logger::init();
    println!("Starting db-writer microservice");

    // Read Kafka configuration from environment variables
    let brokers = env::var("KAFKA_BROKERS").unwrap_or_else(|_| "localhost:9092".to_string());
    let client_id = env::var("KAFKA_CLIENT_ID").unwrap_or_else(|_| "my-client".to_string());
    let username = env::var("KAFKA_USERNAME").ok();
    let password = env::var("KAFKA_PASSWORD").ok();
    let ca_path = env::var("KAFKA_CA_PATH").unwrap_or_else(|_| "/path/to/kafka_ca.pem".to_string());

    // Log Kafka configuration details
    println!("Kafka brokers: {}", brokers);
    println!("Kafka client ID: {}", client_id);
    if let Some(username) = &username {
        println!("Kafka username: {}", username);
    }
    println!("Kafka CA path: {}", ca_path);

    // Kafka configuration
    let mut kafka_config = ClientConfig::new();
    kafka_config
        .set("bootstrap.servers", &brokers)
        .set("group.id", "db-writer-group")
        .set("client.id", &client_id)
        .set("enable.partition.eof", "false")
        .set("session.timeout.ms", "6000")
        .set("enable.auto.commit", "true")
        .set("auto.offset.reset", "earliest")
        .set("message.timeout.ms", "30000") // 30 seconds
        .set("retry.backoff.ms", "300"); // Initial retry time

    // SSL Configuration
    kafka_config.set("security.protocol", "ssl");
    kafka_config.set("ssl.ca.location", &ca_path);

    // SASL Configuration if username and password are provided
    if let (Some(username), Some(password)) = (username, password) {
        kafka_config.set("sasl.mechanism", "PLAIN");
        kafka_config.set("sasl.username", &username);
        kafka_config.set("sasl.password", &password);
        kafka_config.set("security.protocol", "sasl_ssl");
    }

    // Shared connection pools for user databases
    let pools = Arc::new(Mutex::new(HashMap::<String, DbPool>::new()));

    // Spawn worker threads based on CPU cores
    let worker_count = num_cpus::get().max(1);
    println!("Spawning {} worker tasks", worker_count);
    for i in 0..worker_count {
        let pools_clone = Arc::clone(&pools);
        let kafka_config_clone = kafka_config.clone();
        tokio::spawn(async move {
            println!("Worker task {} started", i);
            let consumer = create_consumer(&kafka_config_clone);
            process_messages(consumer, pools_clone).await;
        });
    }

    // Keep main thread alive
    sleep(Duration::from_secs(u64::MAX)).await;
    Ok(())
}

/// Creates a new StreamConsumer instance with the provided configuration.
fn create_consumer(kafka_config: &ClientConfig) -> StreamConsumer {
    let consumer: StreamConsumer = match kafka_config.create() {
        Ok(consumer) => {
            println!("Successfully created Kafka consumer");
            consumer
        }
        Err(e) => {
            error!("Failed to create Kafka consumer: {}", e);
            panic!("Failed to create Kafka consumer: {}", e);
        }
    };
    match consumer.subscribe(&["processed-events"]) {
        Ok(_) => println!("Successfully subscribed to topic 'processed-events'"),
        Err(e) => {
            error!("Failed to subscribe to topic: {}", e);
            panic!("Failed to subscribe to topic: {}", e);
        }
    }
    consumer
}

/// Processes messages from the Kafka consumer.
async fn process_messages(consumer: StreamConsumer, pools: Arc<Mutex<HashMap<String, DbPool>>>) {
    loop {
        match consumer.recv().await {
            Ok(message) => {
                println!("Received message from Kafka");
                if let Some(payload) = message.payload() {
                    match serde_json::from_slice::<ProcessedEvent>(payload) {
                        Ok(event) => {
                            let config_id = event.config_id.clone();
                            let mut pools_lock = pools.lock().await;

                            // Get or create database connection pool
                            let pool = match pools_lock.get(&config_id) {
                                Some(db_pool) => db_pool.pool.clone(),
                                None => {
                                    let pool = create_and_migrate_pool(&event.credentials).await;
                                    pools_lock.insert(
                                        config_id.clone(),
                                        DbPool {
                                            pool: pool.clone(),
                                            schema_version: SCHEMA_VERSION.to_string(),
                                        },
                                    );
                                    pool
                                }
                            };

                            // Write to database with retry logic
                            let mut retries = 0;
                            loop {
                                match write_to_db(&pool, &event).await {
                                    Ok(_) => {
                                        println!(
                                            "Successfully wrote event {} for config {}",
                                            event.id, config_id
                                        );
                                        break;
                                    }
                                    Err(e) => {
                                        if retries < MAX_RETRIES {
                                            retries += 1;
                                            let delay = BASE_RETRY_DELAY_MS * 2u64.pow(retries - 1); // Exponential backoff
                                            error!(
                                                "Failed to write event {} to database (attempt {}/{}): {}. Retrying in {}ms",
                                                event.id, retries, MAX_RETRIES, e, delay
                                            );
                                            sleep(Duration::from_millis(delay)).await;
                                        } else {
                                            error!(
                                                "Failed to write event {} after {} attempts: {}",
                                                event.id, MAX_RETRIES, e
                                            );
                                            break; // Consider sending to a dead-letter queue here
                                        }
                                    }
                                }
                            }
                        }
                        Err(e) => error!("Failed to deserialize Kafka message: {}", e),
                    }
                }
            }
            Err(e) => error!("Kafka consumer error: {}", e),
        }
    }
}

async fn create_and_migrate_pool(cred: &DatabaseCredential) -> sqlx::Pool<sqlx::Postgres> {
    println!("Creating database pool for credentials: {:?}", cred);
    let connect_options = PgConnectOptions::new()
        .host(&cred.host)
        .port(cred.port)
        .database(&cred.database)
        .username(&cred.username)
        .password(&cred.password)
        .ssl_mode(if cred.ssl {
            sqlx::postgres::PgSslMode::Require
        } else {
            sqlx::postgres::PgSslMode::Prefer
        });

    let pool = PgPoolOptions::new()
        .max_connections(5) // Limit per user to manage resources
        .connect_with(connect_options)
        .await
        .expect("Failed to create database pool");

    println!("Applying migrations to database");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to apply migrations");

    pool
}

async fn write_to_db(
    pool: &sqlx::Pool<sqlx::Postgres>,
    event: &ProcessedEvent,
) -> Result<(), sqlx::Error> {
    println!("Writing event {} to database", event.id);
    // Parse processed_at string to a DateTime object
    let processed_at = chrono::DateTime::parse_from_rfc3339(&event.metadata.processed_at)
        .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
        .with_timezone(&chrono::Utc);

    sqlx::query(
        r#"
        INSERT INTO events (id, config_id, event_type, network, processed_data, processed_at, original_event_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
        "#
    )
    .bind(&event.id)
    .bind(&event.config_id)
    .bind(&event.event_type)
    .bind(&event.network)
    .bind(&event.processed_data)
    .bind(processed_at)
    .bind(&event.metadata.original_event_id)
    .execute(pool)
    .await?;

    Ok(())
}
