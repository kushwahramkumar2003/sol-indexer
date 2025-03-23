import { z } from "zod";

export const createWebhookSchema = z.object({
  configurationId: z.string().uuid(),
});
