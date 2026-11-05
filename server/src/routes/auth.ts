import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../async-handler.js";
import { decryptPassword } from "../login-cipher.js";
import { passwordsMatch } from "../passwords.js";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: () => "dashboard-login",
  validate: { keyGeneratorIpFallback: false },
  message: { error: "Too many attempts. Try again later." },
});

export const authRouter = Router();

authRouter.get("/session", (req, res) => {
  res.json({ authenticated: req.session.authenticated === true });
});

authRouter.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const expected = process.env.DASHBOARD_PASSWORD;
    const password = decryptPassword(req.body);
    if (!expected || password === null || !passwordsMatch(password, expected)) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    req.session.authenticated = true;
    res.json({ authenticated: true });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res, next) => {
    req.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }
      res.clearCookie("connect.sid");
      res.json({ authenticated: false });
    });
  }),
);
