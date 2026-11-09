import type { RequestHandler } from "express";
import { requestHasDashboardToken } from "./dashboard-token.js";
import { note } from "./log.js";

export const requireSession: RequestHandler = (req, res, next) => {
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
  note(res, "denied: login required");
  res.status(401).json({ error: "Login required" });
};
