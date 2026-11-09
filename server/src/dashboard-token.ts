import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";

const lifetimeMs = 8 * 60 * 60 * 1000;

type Payload = {
  exp: number;
  pwd: string;
};

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is required");
  }
  return value;
}

function passwordTag(): string {
  return createHash("sha256")
    .update(process.env.DASHBOARD_PASSWORD ?? "")
    .digest("base64url")
    .slice(0, 16);
}

export function issueDashboardToken(now = Date.now()): { token: string; expiresAt: string } {
  const payload: Payload = { exp: now + lifetimeMs, pwd: passwordTag() };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(body).digest("base64url");
  return { token: `${body}.${signature}`, expiresAt: new Date(payload.exp).toISOString() };
}

export function dashboardTokenValid(token: string, now = Date.now()): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }
  const [body, signature] = parts;
  if (!body || !signature) {
    return false;
  }
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    return typeof payload.exp === "number" && payload.exp > now && payload.pwd === passwordTag();
  } catch {
    return false;
  }
}

export function requestHasDashboardToken(req: Request): boolean {
  const header = req.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/.exec(header);
  return match?.[1] ? dashboardTokenValid(match[1]) : false;
}
