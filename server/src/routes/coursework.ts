import { Router } from "express";
import { courseworkCatalog } from "../coursework.js";

export const courseworkRouter = Router();

courseworkRouter.get("/", (_req, res) => {
  res.json(courseworkCatalog());
});
