import { z } from "zod";
import { api } from ".";
import { indexingConfigSchema } from "types";
import { asyncHandler } from "@/lib/asyncHandler";

export type IndexingConfiguration = z.infer<typeof indexingConfigSchema>;

export type SyncStats = {
  syncLogs: Array<{
    id: string;
    startTime: Date;
    endTime: Date | null;
    status: "success" | "failed" | "running";
    itemsSynced: number;
    configId: string;
  }>;
  dataCounts: {
    transactions: number;
    nfts: number;
    tokens: number;
    marketData: number;
  };
  lastSync: {
    id: string;
    startTime: Date;
    endTime: Date | null;
    status: "success" | "failed" | "running";
    itemsSynced: number;
    configId: string;
  } | null;
};

/**
 * Create a new indexing configuration
 */
export const createIndexingConf = asyncHandler(
  async (data: IndexingConfiguration) => {
    const response = await api.post<{
      success: boolean;
      webhookUrl: string;
    }>("/conf", data);
    return response.data;
  }
);

/**
 * Get all indexing configurations for the current user
 */
export const getAllIndexingConfs = asyncHandler(async () => {
  const response = await api.get<{
    success: boolean;
    data: Array<IndexingConfiguration & { id: string; createdAt: string }>;
  }>("/conf");
  return response.data;
});

/**
 * Get a specific indexing configuration by ID
 */
export const getIndexingConfById = asyncHandler(async (id: string) => {
  const response = await api.get<{
    success: boolean;
    data: IndexingConfiguration & {
      id: string;
      createdAt: Date;
      syncLogs: Array<{
        id: string;
        startTime: Date;
        endTime: Date | null;
        status: "success" | "failed" | "running";
        itemsSynced: number;
      }>;
    };
  }>(`/conf/${id}`);
  return response.data;
});

/**
 * Update an existing indexing configuration
 */
export const updateIndexingConf = asyncHandler(
  async (params: { id: string; data: IndexingConfiguration }) => {
    const { id, data } = params;
    const response = await api.put<{
      success: boolean;
      message: string;
      data: IndexingConfiguration & { id: string };
    }>(`/conf/${id}`, data);
    return response.data;
  }
);

/**
 * Toggle the enabled status of an indexing configuration
 */
export const toggleIndexingConfEnabled = asyncHandler(async (id: string) => {
  const response = await api.patch<{
    success: boolean;
    message: string;
    data: IndexingConfiguration & { id: string; enabled: boolean };
  }>(`/conf/${id}/toggle`);
  return response.data;
});

/**
 * Delete an indexing configuration
 */
export const deleteIndexingConf = asyncHandler(async (id: string) => {
  const response = await api.delete<{
    success: boolean;
    message: string;
  }>(`/conf/${id}`);
  return response.data;
});

/**
 * Get sync statistics for an indexing configuration
 */
export const getIndexingConfSyncStats = asyncHandler(async (id: string) => {
  const response = await api.get<{
    success: boolean;
    data: SyncStats;
  }>(`/conf/${id}/stats`);
  return response.data;
});

/**
 * List all webhooks for the current user
 */
export const listWebhooks = asyncHandler(async () => {
  const response = await api.get<{
    success: true;
    webhooks: Array<{
      id: string;
      configurationId: string;
      configurationName: string;
      webhookUrl: string;
      createdAt: string;
    }>;
  }>("/whook/list");
  return response.data;
});

/**
 * Delete a webhook
 */
export const deleteWebhook = asyncHandler(async (id: string) => {
  const response = await api.delete<{
    success: boolean;
    message: string;
  }>(`/whook/${id}`);
  return response.data;
});
