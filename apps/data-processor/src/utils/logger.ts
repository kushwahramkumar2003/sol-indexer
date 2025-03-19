// src/utils/logger.ts
import { createLogger, format, transports } from "winston";
import { config } from "../config";

const logFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

export const logger = createLogger({
  level: config.log.level,
  format: logFormat,
  defaultMeta: { service: "data-processor" },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, ...meta }) => {
          const metaString = Object.keys(meta).length
            ? `\n${JSON.stringify(meta, null, 2)}`
            : "";
          return `${timestamp} ${level}: ${message}${metaString}`;
        })
      ),
    }),
  ],
});

// Add a custom logger for Kafka
export const kafkaLogger = {
  info: (message: string) => logger.info(`Kafka: ${message}`),
  error: (message: string) => logger.error(`Kafka: ${message}`),
  warn: (message: string) => logger.warn(`Kafka: ${message}`),
  debug: (message: string) => logger.debug(`Kafka: ${message}`),
};
