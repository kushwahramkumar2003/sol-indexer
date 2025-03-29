import { z } from "zod";

export const createDatabaseCredentials = z.object({
  host: z.string(),
  port: z.number(),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  ssl: z.boolean(),
});

export const updateDatabaseCredentialsSchema = z.object({
  id: z.string(),
  host: z.string(),
  port: z.number(),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  ssl: z.boolean(),
});
