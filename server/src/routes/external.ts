import { Router } from "express";
import { requireApiToken } from "../require-api-token.js";
import { manageRouter } from "./manage.js";

export const externalRouter = Router();

externalRouter.get("/ping", requireApiToken, (_req, res) => {
  res.json({ ok: true });
});

externalRouter.use(manageRouter);
