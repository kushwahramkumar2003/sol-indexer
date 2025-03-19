import { IndexingCategory, BlockchainNetwork } from "@prisma/client";

export interface WebhookEvent {
  userId: string;
  eventType: IndexingCategory;
  network: BlockchainNetwork;
  data: {
    txHash: string;
    blockNumber: number;
    timestamp: Date;
    accounts: string[];
    metadata: Record<string, unknown>;
  };
}

export interface KafkaMessage {
  key: string;
  value: WebhookEvent;
  headers: {
    "event-type": IndexingCategory;
    "correlation-id": string;
  };
}

export type EventHandler = (message: KafkaMessage) => Promise<void>;
