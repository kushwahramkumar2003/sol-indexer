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

export const createIndexingConf = asyncHandler(
  async (data: IndexingConfiguration) => {
    const response = await api.post<{
      success: boolean;
      webhookUrl: string;
    }>("/conf", data);
    return response.data;
  }
);

export const getAllIndexingConfs = asyncHandler(async () => {
  const response = await api.get<{
    success: boolean;
    data: Array<IndexingConfiguration & { id: string; createdAt: string }>;
  }>("/conf");
  return response.data;
});

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

export const toggleIndexingConfEnabled = asyncHandler(async (id: string) => {
  const response = await api.patch<{
    success: boolean;
    message: string;
    data: IndexingConfiguration & { id: string; enabled: boolean };
  }>(`/conf/${id}/toggle`);
  return response.data;
});

export const deleteIndexingConf = asyncHandler(async (id: string) => {
  const response = await api.delete<{
    success: boolean;
    message: string;
  }>(`/conf/${id}`);
  return response.data;
});

export const getIndexingConfSyncStats = asyncHandler(async (id: string) => {
  const response = await api.get<{
    success: boolean;
    data: SyncStats;
  }>(`/conf/${id}/stats`);
  return response.data;
});

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

export const deleteWebhook = asyncHandler(async (id: string) => {
  const response = await api.delete<{
    success: boolean;
    message: string;
  }>(`/whook/${id}`);
  return response.data;
});
