import { Router } from "express";
import { asyncHandler } from "../async-handler.js";
import { closeOpenHour, openHourStatus, startOpenHour } from "../open-hour.js";
import { requireSession } from "../require-session.js";
import { currentTokenStatus, issueToken } from "../tokens.js";

export const tokenRouter = Router();

tokenRouter.use(requireSession);

tokenRouter.get(
  "/current",
  asyncHandler(async (_req, res) => {
    res.json(await currentTokenStatus());
  }),
);

tokenRouter.post(
  "/",
  asyncHandler(async (_req, res) => {
    const issued = await issueToken();
    res.json({ token: issued.token, expiresAt: issued.expiresAt.toISOString() });
  }),
);

tokenRouter.get(
  "/open-hour",
  asyncHandler(async (_req, res) => {
    res.json(await openHourStatus());
  }),
);

tokenRouter.post(
  "/open-hour",
  asyncHandler(async (_req, res) => {
    res.json(await startOpenHour());
  }),
);

tokenRouter.delete(
  "/open-hour",
  asyncHandler(async (_req, res) => {
    res.json(await closeOpenHour());
  }),
);
