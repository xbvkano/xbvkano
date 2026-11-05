import type { RequestHandler } from "express";
import { requireApiToken } from "./require-api-token.js";

export const requireSessionOrToken: RequestHandler = (req, res, next) => {
  if (req.session.authenticated === true) {
    next();
    return;
  }
  void requireApiToken(req, res, next);
};
