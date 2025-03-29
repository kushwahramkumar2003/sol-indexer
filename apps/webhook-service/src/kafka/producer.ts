import { Kafka, type Producer, type ProducerRecord } from "kafkajs";
import fs from "fs";
import { config } from "../config";
import { logger } from "../utils/logger";

class KafkaProducer {
  private producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: [config.kafka.broker],
      ssl: {
        // rejectUnauthorized: false,
        ca: [
          fs.readFileSync(
            "/mnt/Data/Language-Play-Ground/Projects/MERN/my/sol-indexer/kafka_ca.pem",
            "utf-8"
          ),
        ],
      },
      sasl:
        config.kafka.username && config.kafka.password
          ? {
              mechanism: "plain",
              username: config.kafka.username,
              password: config.kafka.password,
            }
          : undefined,
    });

    this.producer = kafka.producer();
  }

  async connect() {
    await this.producer.connect();
    logger.info("Kafka producer connected");
  }

  async send(message: ProducerRecord) {
    try {
      await this.producer.send(message);
      logger.debug(`Message sent to ${message.topic}`);
    } catch (error) {
      logger.error("Error sending message to Kafka:", error as Error);
      throw error;
    }
  }

  async disconnect() {
    await this.producer.disconnect();
    logger.info("Kafka producer disconnected");
  }
}

export const kafkaProducer = new KafkaProducer();
