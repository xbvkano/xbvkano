import type { RequestHandler } from "express";

export const requireSession: RequestHandler = (req, res, next) => {
  if (req.session.authenticated !== true) {
    res.status(401).json({ error: "Login required" });
    return;
  }
  next();
};
