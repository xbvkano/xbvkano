import type { RequestHandler } from "express";
import { requestHasDashboardToken } from "./dashboard-token.js";
import { note } from "./log.js";
import { isOpenHour } from "./open-hour.js";
import { requireApiToken } from "./require-api-token.js";

export const requireApplyAccess: RequestHandler = (req, res, next) => {
  if (req.session.authenticated === true) {
    note(res, "allowed by login cookie");
    next();
    return;
  }
  if (requestHasDashboardToken(req)) {
    note(res, "allowed by dashboard login token");
    next();
    return;
  }
  void isOpenHour()
    .then((open) => {
      if (open) {
        note(res, "allowed because open hour is on");
        next();
        return;
      }
      note(res, "open hour is closed, checking bearer token");
      void requireApiToken(req, res, next);
    })
    .catch(next);
};
