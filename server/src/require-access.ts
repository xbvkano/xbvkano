import type { RequestHandler } from "express";
import { isOpenHour } from "./open-hour.js";
import { requireApiToken } from "./require-api-token.js";

export const requireApplyAccess: RequestHandler = (req, res, next) => {
  if (req.session.authenticated === true) {
    next();
    return;
  }
  void isOpenHour()
    .then((open) => {
      if (open) {
        next();
        return;
      }
      void requireApiToken(req, res, next);
    })
    .catch(next);
};
