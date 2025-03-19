import crypto from "crypto";
import { config } from "../config";
import prisma from "db/client";

export class WebhookModel {
  static async createWebhook(
    userId: string,
    configId: string
  ): Promise<string> {
    // Generate a unique webhook path using userId, configId and a random string
    const randomString = crypto.randomBytes(16).toString("hex");
    const webhookHash = crypto
      .createHmac("sha256", config.webhookSecret)
      .update(`${userId}:${configId}:${randomString}`)
      .digest("hex");

    const webhookPath = `${webhookHash}`;

    // Store the webhook registration
    await prisma.webhookRegistration.create({
      data: {
        userId,
        configurationId: configId,
        webhookPath,
      },
    });

    return `${config.apiBaseUrl}/webhook/${webhookPath}`;
  }

  static async getWebhookByPath(webhookPath: string) {
    return prisma.webhookRegistration.findUnique({
      where: { webhookPath },
      include: {
        configuration: {
          include: {
            user: {
              include: {
                databaseCredentials: true,
              },
            },
          },
        },
      },
    });
  }

  static async listWebhooks(userId: string) {
    return prisma.webhookRegistration.findMany({
      where: { userId },
      include: {
        configuration: true,
      },
    });
  }

  static async deleteWebhook(id: string, userId: string) {
    return prisma.webhookRegistration.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }
}
