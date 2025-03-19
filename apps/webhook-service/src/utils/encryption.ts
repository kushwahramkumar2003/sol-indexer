// utils/encryption.ts
import type { DatabaseCredential } from "@prisma/client";
import crypto from "crypto";
import { config } from "../config";

const algorithm = "aes-256-gcm";
const ivLength = 12;

export function encryptCredentials(creds: DatabaseCredential): {
  iv: string;
  encrypted: string;
} {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(config.encryptionKey, "hex"),
    iv
  );

  let encrypted = cipher.update(JSON.stringify(creds), "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    encrypted: encrypted + "." + authTag.toString("base64"),
  };
}

export function decryptCredentials(encryptedData: {
  iv: string;
  encrypted: string;
}): DatabaseCredential {
  const iv = Buffer.from(encryptedData.iv, "base64");

  // Split the encrypted data and auth tag
  const parts = encryptedData.encrypted.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted data format");
  }
  const encrypted = parts[0]!;
  const authTag = Buffer.from(parts[1]!, "base64");

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(config.encryptionKey, "hex"),
    iv
  );
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}
