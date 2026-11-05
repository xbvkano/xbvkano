import { createDecipheriv, createHash } from "node:crypto";

function cipherKey(): Buffer | null {
  const secret = process.env.LOGIN_CIPHER_SECRET;
  if (!secret) {
    return null;
  }
  return createHash("sha256").update(secret).digest();
}

export function decryptPassword(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const { iv, data } = payload as { iv?: unknown; data?: unknown };
  if (typeof iv !== "string" || typeof data !== "string") {
    return null;
  }

  const key = cipherKey();
  if (!key) {
    return null;
  }

  try {
    const ivBuffer = Buffer.from(iv, "base64");
    const dataBuffer = Buffer.from(data, "base64");
    if (ivBuffer.length !== 12 || dataBuffer.length < 17) {
      return null;
    }

    const tag = dataBuffer.subarray(dataBuffer.length - 16);
    const ciphertext = dataBuffer.subarray(0, dataBuffer.length - 16);
    const decipher = createDecipheriv("aes-256-gcm", key, ivBuffer);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
