import { Router } from "express";
import { asyncHandler } from "../async-handler.js";
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
