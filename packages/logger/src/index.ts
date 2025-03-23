import {
  createLogger,
  format,
  transports,
  Logger as WinstonLogger,
} from "winston";
import type { LoggerOptions } from "./types";

const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length
      ? ` ${JSON.stringify(meta)}`
      : "";
    return `${timestamp} [${level.toUpperCase()}] ${message}${metaString}`;
  })
);

export class Logger {
  private logger: WinstonLogger;

  constructor(options: LoggerOptions) {
    const { service, level = "info", defaultMeta = {} } = options;

    this.logger = createLogger({
      level,
      format: logFormat,
      defaultMeta: { service, ...defaultMeta },
      transports: [
        new transports.Console({
          format: format.combine(format.colorize(), logFormat),
        }),
      ],
    });
  }

  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, meta);
  }

  addTransport(transport: any): void {
    this.logger.add(transport);
  }
}

export class KafkaLogger extends Logger {
  constructor(options: LoggerOptions) {
    super(options);
  }

  info(message: string, meta?: Record<string, any>): void {
    super.info(`Kafka: ${message}`, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    super.error(`Kafka: ${message}`, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    super.warn(`Kafka: ${message}`, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    super.debug(`Kafka: ${message}`, meta);
  }
}

export default Logger;
