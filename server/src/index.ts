import type { ErrorRequestHandler } from "express";
import express from "express";
import session from "express-session";
import multer from "multer";
import { ApiError } from "./api-error.js";
import "./env.js";
import { uploadDir } from "./media.js";
import { authRouter } from "./routes/auth.js";
import { entryRouter } from "./routes/entries.js";
import { externalRouter } from "./routes/external.js";
import { profileRouter } from "./routes/profile.js";
import { showcaseRouter } from "./routes/showcase.js";
import { tokenRouter } from "./routes/tokens.js";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || !process.env.DASHBOARD_PASSWORD || !process.env.LOGIN_CIPHER_SECRET) {
  throw new Error("SESSION_SECRET, DASHBOARD_PASSWORD, and LOGIN_CIPHER_SECRET are required");
}

const clientOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const app = express();
app.set("trust proxy", 1);

app.use((req, res, next) => {
  const origin = req.get("origin");
  if (origin && clientOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
  }),
);

app.use("/media", express.static(uploadDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth/tokens", tokenRouter);
app.use("/api/auth", authRouter);
app.use("/api/external", externalRouter);

app.use("/api/profile", profileRouter);
app.use("/api/showcase", showcaseRouter);
app.use("/api/projects", entryRouter("project"));
app.use("/api/certifications", entryRouter("certificate"));

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "Image must be 5 MB or smaller" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
