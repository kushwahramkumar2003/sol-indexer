import { config } from "../config";

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ) {
    const entry = {
      timestamp: new Date().toISOString(),
      service: "webhook-service",
      level,
      message,
      ...meta,
    };

    console[level](JSON.stringify(entry));
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (config.env === "development") {
      this.log("debug", message, meta);
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log("warn", message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>) {
    this.log("error", message, {
      error: error?.message,
      stack: error?.stack,
      ...meta,
    });
  }
}

export const log = new Logger();
