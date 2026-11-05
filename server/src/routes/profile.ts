import { Router } from "express";
import { asyncHandler } from "../async-handler.js";
import { formatProfile } from "../content.js";
import { prisma } from "../lib/prisma.js";

export const profileRouter = Router();

profileRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const profile = await prisma.profile.findUnique({ where: { id: 1 } });
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.json(formatProfile(profile));
  }),
);
