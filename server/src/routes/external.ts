import { Router } from "express";
import { asyncHandler } from "../async-handler.js";
import { openHourStatus } from "../open-hour.js";
import { prisma } from "../lib/prisma.js";
import { requireApiToken } from "../require-api-token.js";
import { currentTokenStatus } from "../tokens.js";
import { manageRouter } from "./manage.js";

export const externalRouter = Router();

externalRouter.get("/ping", requireApiToken, (_req, res) => {
  res.json({ ok: true });
});

externalRouter.get(
  "/health",
  requireApiToken,
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      res.status(503).json({ ok: false, token: "active", database: "unavailable" });
      return;
    }
    const token = await currentTokenStatus();
    const openHour = await openHourStatus();
    res.json({
      ok: true,
      token: "active",
      expiresAt: token.active ? token.expiresAt : null,
      database: "ok",
      openHour,
    });
  }),
);

externalRouter.use(manageRouter);
