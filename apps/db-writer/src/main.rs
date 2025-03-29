use db_writer::{DatabaseCredential, DbPool, EventType, ProcessedEvent};
use dotenv::dotenv;
use log::error;
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

const SCHEMA_VERSION: &str = "20250322000000";
const MAX_RETRIES: u32 = 1;
const BASE_RETRY_DELAY_MS: u64 = 100;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    env_logger::init();
    println!("Starting db-writer microservice");

    let brokers = env::var("KAFKA_BROKERS").unwrap_or_else(|_| "localhost:9092".to_string());
    let client_id = env::var("KAFKA_CLIENT_ID").unwrap_or_else(|_| "my-client".to_string());
    let username = env::var("KAFKA_USERNAME").ok();
    let password = env::var("KAFKA_PASSWORD").ok();
    let ca_path = env::var("KAFKA_CA_PATH").unwrap_or_else(|_| "/path/to/kafka_ca.pem".to_string());

    println!("Kafka configuration - Brokers: {}", brokers);
    println!("Kafka configuration - Client ID: {}", client_id);
    if let Some(username) = &username {
        println!("Kafka configuration - Username: {}", username);
    }
    println!("Kafka configuration - CA Path: {}", ca_path);

    let mut kafka_config = ClientConfig::new();
    kafka_config
        .set("bootstrap.servers", &brokers)
        .set("group.id", "db-writer-group")
        .set("client.id", &client_id)
        .set("enable.partition.eof", "false")
        .set("session.timeout.ms", "6000")
        .set("enable.auto.commit", "true")
        .set("auto.offset.reset", "earliest")
        .set("message.timeout.ms", "30000")
        .set("retry.backoff.ms", "300");

    kafka_config.set("security.protocol", "ssl");
    kafka_config.set("ssl.ca.location", &ca_path);

    if let (Some(username), Some(password)) = (username, password) {
        kafka_config.set("sasl.mechanism", "PLAIN");
        kafka_config.set("sasl.username", &username);
        kafka_config.set("sasl.password", &password);
        kafka_config.set("security.protocol", "sasl_ssl");
        println!("Kafka SASL/SSL enabled with mechanism: PLAIN");
    } else {
        println!("Kafka SSL enabled without SASL");
    }

    let pools = Arc::new(Mutex::new(HashMap::<String, DbPool>::new()));
    let worker_count = num_cpus::get().max(1);
    println!("Spawning {} worker tasks", worker_count);
    for i in 0..worker_count {
        let pools_clone = Arc::clone(&pools);
        let kafka_config_clone = kafka_config.clone();
        tokio::spawn(async move {
            println!("Worker task {} started", i);
            let consumer = create_consumer(&kafka_config_clone);
            println!("Worker task {} subscribed to Kafka", i);
            process_messages(consumer, pools_clone).await;
        });
    }

    println!("Main thread sleeping to keep application alive");
    sleep(Duration::from_secs(u64::MAX)).await;
    Ok(())
}

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
            error!("Failed to subscribe to topic 'processed-events': {}", e);
            panic!("Failed to subscribe to topic: {}", e);
        }
    };
    consumer
}

async fn process_messages(consumer: StreamConsumer, pools: Arc<Mutex<HashMap<String, DbPool>>>) {
    loop {
        match consumer.recv().await {
            Ok(message) => {
                println!(
                    "Received message from Kafka - Topic: {}, Partition: {}, Offset: {}",
                    message.topic(),
                    message.partition(),
                    message.offset()
                );
                if let Some(payload) = message.payload() {
                    println!(
                        "Message payload received: {:?}",
                        String::from_utf8_lossy(payload)
                    );
                    match serde_json::from_slice::<ProcessedEvent>(payload) {
                        Ok(event) => {
                            println!(
                                "Deserialized event - ID: {}, Type: {:?}",
                                event.id, event.event_type
                            );
                            let config_id = event.config_id.clone();
                            let mut pools_lock = pools.lock().await;

                            let pool = match pools_lock.get(&config_id) {
                                Some(db_pool) => {
                                    println!(
                                        "Using existing database pool for config_id: {}",
                                        config_id
                                    );
                                    db_pool.pool.clone()
                                }
                                None => {
                                    println!(
                                        "Creating new database pool for config_id: {}",
                                        config_id
                                    );
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

                            let mut retries = 0;
                            loop {
                                match write_to_db(&pool, &event).await {
                                    Ok(_) => {
                                        println!(
                                            "Successfully wrote event {} for config_id {}",
                                            event.id, config_id
                                        );
                                        break;
                                    }
                                    Err(e) => {
                                        if retries < MAX_RETRIES {
                                            retries += 1;
                                            let delay = BASE_RETRY_DELAY_MS * 2u64.pow(retries - 1);
                                            error!(
                                                "Failed to write event {} to database (attempt {}/{}): {}. Retrying in {}ms",
                                                event.id, retries, MAX_RETRIES, e, delay
                                            );
                                            sleep(Duration::from_millis(delay)).await;
                                        } else {
                                            error!(
                                                "Failed to write event {} for config_id {} after {} attempts: {}",
                                                event.id, config_id, MAX_RETRIES, e
                                            );
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        Err(e) => error!("Failed to deserialize Kafka message: {}", e),
                    }
                } else {
                    println!("Received empty message payload from Kafka");
                }
            }
            Err(e) => error!("Kafka consumer error: {}", e),
        }
    }
}

async fn create_and_migrate_pool(cred: &DatabaseCredential) -> sqlx::Pool<sqlx::Postgres> {
    println!(
        "Creating database pool - Host: {}, Database: {}",
        cred.host, cred.database
    );
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

    let pool = match PgPoolOptions::new()
        .max_connections(5)
        .connect_with(connect_options)
        .await
    {
        Ok(pool) => {
            println!("Database pool created successfully");
            pool
        }
        Err(e) => {
            error!("Failed to create database pool: {}", e);
            panic!("Failed to create database pool: {}", e);
        }
    };

    println!("Applying migrations to database");
    match sqlx::migrate!("./migrations").run(&pool).await {
        Ok(_) => println!("Migrations applied successfully"),
        Err(e) => {
            error!("Failed to apply migrations: {}", e);
            panic!("Failed to apply migrations: {}", e);
        }
    };

    pool
}

async fn write_to_db(
    pool: &sqlx::Pool<sqlx::Postgres>,
    event: &ProcessedEvent,
) -> Result<(), sqlx::Error> {
    println!(
        "Writing event {} to database - Type: {:?}",
        event.id, event.event_type
    );
    let processed_at = chrono::DateTime::parse_from_rfc3339(&event.metadata.processed_at)
        .map_err(|e| {
            error!("Failed to parse processed_at for event {}: {}", event.id, e);
            sqlx::Error::Decode(Box::new(e))
        })?
        .with_timezone(&chrono::Utc);
    println!("Parsed processed_at: {}", processed_at);

    match event.event_type {
        EventType::NftBids => {
            let bid_amount = event.processed_data["bid_amount"].as_f64().ok_or_else(|| {
                error!("Missing bid_amount for event {}", event.id);
                sqlx::Error::Decode("Missing bid_amount".into())
            })?;
            let bidder = event.processed_data["bidder"].as_str().ok_or_else(|| {
                error!("Missing bidder for event {}", event.id);
                sqlx::Error::Decode("Missing bidder".into())
            })?;
            let nft_mint = event.processed_data["nft_mint"].as_str().ok_or_else(|| {
                error!("Missing nft_mint for event {}", event.id);
                sqlx::Error::Decode("Missing nft_mint".into())
            })?;

            println!(
                "Extracted NFT_BIDS fields - bid_amount: {}, bidder: {}, nft_mint: {}",
                bid_amount, bidder, nft_mint
            );
            sqlx::query(
                r#"
                INSERT INTO nft_bids (id, config_id, network, processed_at, original_event_id, bid_amount, bidder, nft_mint, processed_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(&event.id)
            .bind(&event.config_id)
            .bind(&event.network)
            .bind(processed_at)
            .bind(&event.metadata.original_event_id)
            .bind(bid_amount)
            .bind(bidder)
            .bind(nft_mint)
            .bind(&event.processed_data)
            .execute(pool)
            .await?;
        }
        EventType::NftPrices => {
            let price = event.processed_data["price"].as_f64().ok_or_else(|| {
                error!("Missing price for event {}", event.id);
                sqlx::Error::Decode("Missing price".into())
            })?;
            let marketplace = event.processed_data["source"].as_str().ok_or_else(|| {
                error!("Missing source for event {}", event.id);
                sqlx::Error::Decode("Missing source".into())
            })?;
            let nft_mint = event.processed_data["nftMint"].as_str().ok_or_else(|| {
                error!("Missing nftMint for event {}", event.id);
                sqlx::Error::Decode("Missing nftMint".into())
            })?;

            println!(
                "Extracted NFT_PRICES fields - price: {}, marketplace: {}, nft_mint: {}",
                price, marketplace, nft_mint
            );
            sqlx::query(
                r#"
                INSERT INTO nft_prices (id, config_id, network, processed_at, original_event_id, price, marketplace, nft_mint, processed_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(&event.id)
            .bind(&event.config_id)
            .bind(&event.network)
            .bind(processed_at)
            .bind(&event.metadata.original_event_id)
            .bind(price)
            .bind(marketplace)
            .bind(nft_mint)
            .bind(&event.processed_data)
            .execute(pool)
            .await?;
        }
        EventType::TokenBorrow => {
            let borrow_amount =
                event.processed_data["borrow_amount"]
                    .as_f64()
                    .ok_or_else(|| {
                        error!("Missing borrow_amount for event {}", event.id);
                        sqlx::Error::Decode("Missing borrow_amount".into())
                    })?;
            let borrower = event.processed_data["borrower"].as_str().ok_or_else(|| {
                error!("Missing borrower for event {}", event.id);
                sqlx::Error::Decode("Missing borrower".into())
            })?;
            let token_mint = event.processed_data["token_mint"].as_str().ok_or_else(|| {
                error!("Missing token_mint for event {}", event.id);
                sqlx::Error::Decode("Missing token_mint".into())
            })?;

            println!(
                "Extracted TOKEN_BORROW fields - borrow_amount: {}, borrower: {}, token_mint: {}",
                borrow_amount, borrower, token_mint
            );
            sqlx::query(
                r#"
                INSERT INTO token_borrow (id, config_id, network, processed_at, original_event_id, borrow_amount, borrower, token_mint, processed_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(&event.id)
            .bind(&event.config_id)
            .bind(&event.network)
            .bind(processed_at)
            .bind(&event.metadata.original_event_id)
            .bind(borrow_amount)
            .bind(borrower)
            .bind(token_mint)
            .bind(&event.processed_data)
            .execute(pool)
            .await?;
        }
        EventType::TokenPrices => {
            let price = event.processed_data["price"].as_f64().ok_or_else(|| {
                error!("Missing price for event {}", event.id);
                sqlx::Error::Decode("Missing price".into())
            })?;
            let currency_pair =
                event.processed_data["currency_pair"]
                    .as_str()
                    .ok_or_else(|| {
                        error!("Missing currency_pair for event {}", event.id);
                        sqlx::Error::Decode("Missing currency_pair".into())
                    })?;
            let token_mint = event.processed_data["token_mint"].as_str().ok_or_else(|| {
                error!("Missing token_mint for event {}", event.id);
                sqlx::Error::Decode("Missing token_mint".into())
            })?;

            println!(
                "Extracted TOKEN_PRICES fields - price: {}, currency_pair: {}, token_mint: {}",
                price, currency_pair, token_mint
            );
            sqlx::query(
                r#"
                INSERT INTO nft_prices (id, config_id, network, processed_at, original_event_id, price, currency_pair, token_mint, processed_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(&event.id)
            .bind(&event.config_id)
            .bind(&event.network)
            .bind(processed_at)
            .bind(&event.metadata.original_event_id)
            .bind(price)
            .bind(currency_pair)
            .bind(token_mint)
            .bind(&event.processed_data)
            .execute(pool)
            .await?;
        }
        EventType::Transactions => {
            let tx_hash = event.processed_data["signature"].as_str().ok_or_else(|| {
                error!("Missing tx_hash for event {}", event.id);
                sqlx::Error::Decode("Missing tx_hash".into())
            })?;
            let block_number = event.processed_data["block_number"].as_i64();
            let fee = event.processed_data["fee"].as_f64().ok_or_else(|| {
                error!("Missing fee for event {}", event.id);
                sqlx::Error::Decode("Missing fee".into())
            })?;
            let success = event.processed_data["success"].as_bool().ok_or_else(|| {
                error!("Missing success for event {}", event.id);
                sqlx::Error::Decode("Missing success".into())
            })?;

            println!(
                "Extracted TRANSACTIONS fields - tx_hash: {}, block_number: {:?}, fee: {}, success: {}",
                tx_hash, block_number, fee, success
            );
            sqlx::query(
                r#"
                INSERT INTO transactions (id, config_id, network, processed_at, original_event_id, tx_hash, block_number, fee, success, processed_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO NOTHING
                "#
            )
            .bind(&event.id)
            .bind(&event.config_id)
            .bind(&event.network)
            .bind(processed_at)
            .bind(&event.metadata.original_event_id)
            .bind(tx_hash)
            .bind(block_number)
            .bind(fee)
            .bind(success)
            .bind(&event.processed_data)
            .execute(pool)
            .await?;
        }
        EventType::Unknown => {
            error!(
                "Unknown event type for event {}: {:?}",
                event.id, event.event_type
            );
            return Err(sqlx::Error::RowNotFound);
        }
    }

    println!("Event {} successfully written to database", event.id);
    Ok(())
}
