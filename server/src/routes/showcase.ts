import { Router } from "express";
import { asyncHandler } from "../async-handler.js";
import { loadPortfolio } from "../content.js";

export const showcaseRouter = Router();

showcaseRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await loadPortfolio());
  }),
);
