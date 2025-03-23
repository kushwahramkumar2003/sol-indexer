import type {
  IndexingCategory,
  BlockchainNetwork,
  DatabaseCredential,
} from "@prisma/client";

export interface WebhookEvent {
  userId: string;
  eventType: IndexingCategory;
  network: BlockchainNetwork;
  data: Record<string, any>;
}

export interface KafkaMessage {
  key: string;
  value: string;
  headers: {
    "event-type": string;
    "correlation-id"?: string;
  };
}

export interface WebhookRegistration {
  id: string;
  userId: string;
  webhookPath: string;
  configurationId: string;
  created: Date;
}

export interface ProcessedWebhook {
  configId: string;
  eventType: IndexingCategory;
  network: BlockchainNetwork;
  data: Record<string, any>;
  credentials: DatabaseCredential;
}

export type EventHandler = (message: KafkaMessage) => Promise<void>;
