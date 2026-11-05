import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { ApiError } from "./api-error.js";

const extensions: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads");
mkdirSync(uploadDir, { recursive: true });

function extensionFor(mimetype: string): string {
  const extension = extensions[mimetype];
  if (!extension) {
    throw new ApiError(400, "Upload a png, jpeg, webp, or gif");
  }
  return extension;
}

export const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, uploadDir);
    },
    filename: (_req, file, callback) => {
      try {
        callback(null, `${randomBytes(16).toString("hex")}${extensionFor(file.mimetype)}`);
      } catch (error) {
        callback(error instanceof Error ? error : new Error("Upload failed"), "");
      }
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!extensions[file.mimetype]) {
      callback(new ApiError(400, "Upload a png, jpeg, webp, or gif"));
      return;
    }
    callback(null, true);
  },
});
