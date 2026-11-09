import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../async-handler.js";
import { issueDashboardToken, requestHasDashboardToken } from "../dashboard-token.js";
import { decryptPassword } from "../login-cipher.js";
import { note } from "../log.js";
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
  const cookie = req.session.authenticated === true;
  const dashboardToken = requestHasDashboardToken(req);
  note(
    res,
    cookie
      ? "session: logged in by cookie"
      : dashboardToken
        ? "session: logged in by dashboard token"
        : "session: not logged in",
  );
  res.json({ authenticated: cookie || dashboardToken });
});

authRouter.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const expected = process.env.DASHBOARD_PASSWORD;
    const password = decryptPassword(req.body);
    if (!expected || password === null || !passwordsMatch(password, expected)) {
      note(res, password === null ? "login denied: password could not be read" : "login denied: password did not match");
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    req.session.authenticated = true;
    const issued = issueDashboardToken();
    note(res, "login accepted and a dashboard token was issued");
    res.json({ authenticated: true, token: issued.token, expiresAt: issued.expiresAt });
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
