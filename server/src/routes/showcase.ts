import { Router } from "express";
import { asyncHandler } from "../async-handler.js";
import { courseworkCatalog } from "../coursework.js";
import { loadPortfolio } from "../content.js";

export const showcaseRouter = Router();

showcaseRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const portfolio = await loadPortfolio();
    const coursework = courseworkCatalog();
    res.json({
      ...portfolio,
      coursework,
      entries: {
        ...portfolio.entries,
        coursework: [...portfolio.entries.coursework, ...coursework],
      },
    });
  }),
);
