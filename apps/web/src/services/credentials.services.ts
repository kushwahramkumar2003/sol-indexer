import { z } from "zod";
import { api } from ".";
import {
  createDatabaseCredentials,
  updateDatabaseCredentialsSchema,
} from "types";
import { asyncHandler } from "@/lib/asyncHandler";

export const getAllDatabases = asyncHandler(async () => {
  return (await api.get("/cred/credentials")).data;
});

export const getDatabaseById = asyncHandler(async ({ id }: { id: string }) => {
  return (await api.get(`/cred/credential?id=${id}`)).data;
});
export const createDatabaseHand = asyncHandler(
  async (data: z.infer<typeof createDatabaseCredentials>) => {
    return (await api.post("/cred/add", { ...data })).data;
  }
);
export const deleteDatabaseHandler = asyncHandler(async ({ id }: { id: string }) => {
  return (await api.delete(`/cred/credential?id=${id}`)).data;
});
export const updateDatabaseHandler = asyncHandler(
  async (data: z.infer<typeof updateDatabaseCredentialsSchema>) => {
    return (await api.put("/cred/credential", { ...data })).data;
  }
);
