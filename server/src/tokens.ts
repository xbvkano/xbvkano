import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./lib/prisma.js";

const TOKEN_LIFETIME_MS = 8 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueToken(): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_LIFETIME_MS);

  await prisma.$transaction([
    prisma.apiToken.updateMany({
      where: { revokedAt: null },
      data: { revokedAt: now },
    }),
    prisma.apiToken.create({
      data: {
        tokenHash: hashToken(token),
        expiresAt,
      },
    }),
  ]);

  return { token, expiresAt };
}

export async function currentTokenStatus(): Promise<
  { active: true; expiresAt: string } | { active: false; status?: "Token expired" }
> {
  const latest = await prisma.apiToken.findFirst({
    where: { revokedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return { active: false };
  }

  if (latest.expiresAt.getTime() <= Date.now()) {
    return { active: false, status: "Token expired" };
  }

  return { active: true, expiresAt: latest.expiresAt.toISOString() };
}
