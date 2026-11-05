import type { RequestHandler } from "express";
import { prisma } from "./lib/prisma.js";
import { hashToken } from "./tokens.js";

export const requireApiToken: RequestHandler = async (req, res, next) => {
  const header = req.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/.exec(header);
  if (!match) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const token = match[1];
  if (!token) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    const record = await prisma.apiToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!record || record.revokedAt) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      res.status(401).json({ error: "Token expired" });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
