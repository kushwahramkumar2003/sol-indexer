// src/services/metrics.ts
import { Counter, Histogram, Registry } from "prom-client";
import { createServer } from "http";
import { logger } from "../utils/logger";

export class MetricsService {
  private registry: Registry;
  private counters: Map<string, Counter>;
  private histograms: Map<string, Histogram>;
  private server: ReturnType<typeof createServer> | null = null;

  constructor() {
    this.registry = new Registry();
    this.counters = new Map();
    this.histograms = new Map();

    // Initialize standard metrics
    this.createCounter(
      "events_received_total",
      "Total number of events received",
      ["event_type"]
    );
    this.createCounter(
      "events_processed_total",
      "Total number of events processed",
      ["event_type", "status"]
    );
    this.createCounter(
      "events_dlq_total",
      "Total number of events sent to DLQ",
      ["event_type"]
    );
    this.createCounter(
      "kafka_producer_errors",
      "Total number of Kafka producer errors",
      ["topic"]
    );

    this.createHistogram(
      "event_processing_duration_ms",
      "Event processing duration in milliseconds",
      ["event_type"]
    );
    this.createHistogram(
      "db_query_duration_ms",
      "Database query duration in milliseconds",
      ["operation"]
    );
    this.createHistogram(
      "kafka_produce_duration_ms",
      "Kafka produce duration in milliseconds",
      ["topic"]
    );
  }

  private createCounter(
    name: string,
    help: string,
    labelNames: string[] = []
  ): Counter {
    const counter = new Counter({
      name,
      help,
      labelNames,
      registers: [this.registry],
    });
    this.counters.set(name, counter);
    return counter;
  }

  private createHistogram(
    name: string,
    help: string,
    labelNames: string[] = []
  ): Histogram {
    const histogram = new Histogram({
      name,
      help,
      labelNames,
      registers: [this.registry],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    });
    this.histograms.set(name, histogram);
    return histogram;
  }

  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    const counter = this.counters.get(name);
    if (counter) {
      counter.inc(labels);
    } else {
      logger.warn(`Counter ${name} not found`);
    }
  }

  observeHistogram(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): void {
    const histogram = this.histograms.get(name);
    if (histogram) {
      histogram.observe(labels, value);
    } else {
      logger.warn(`Histogram ${name} not found`);
    }
  }

  startServer(port: number): void {
    this.server = createServer(async (req, res) => {
      if (req.url === "/metrics") {
        res.setHeader("Content-Type", this.registry.contentType);
        res.end(await this.registry.metrics());
      } else {
        res.statusCode = 404;
        res.end("Not found");
      }
    });

    this.server.listen(port, () => {
      logger.info(`Metrics server started on port ${port}`);
    });
  }

  stopServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}
