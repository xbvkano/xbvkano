import type { RequestHandler } from "express";
import { prisma } from "./lib/prisma.js";
import { note } from "./log.js";
import { hashToken } from "./tokens.js";

export const requireApiToken: RequestHandler = async (req, res, next) => {
  const header = req.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/.exec(header);
  if (!match?.[1]) {
    note(res, "denied: no bearer token was sent");
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    const record = await prisma.apiToken.findUnique({
      where: { tokenHash: hashToken(match[1]) },
    });

    if (!record || record.revokedAt) {
      note(res, "denied: bearer token is unknown or revoked");
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      note(res, "denied: bearer token is expired");
      res.status(401).json({ error: "Token expired" });
      return;
    }

    note(res, "allowed by API token");
    next();
  } catch (error) {
    next(error);
  }
};
