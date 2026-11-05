import multer from "multer";
import { ApiError } from "./api-error.js";
import { prisma } from "./lib/prisma.js";

const extensions: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!extensions[file.mimetype]) {
      callback(new ApiError(400, "Upload a png, jpeg, webp, or gif"));
      return;
    }
    callback(null, true);
  },
});

export function imageExtension(mimetype: string): string {
  const extension = extensions[mimetype];
  if (!extension) {
    throw new ApiError(400, "Upload a png, jpeg, webp, or gif");
  }
  return extension;
}

export async function saveImage(file: { mimetype: string; buffer: Buffer }): Promise<string> {
  imageExtension(file.mimetype);
  const media = await prisma.media.create({
    data: {
      mimeType: file.mimetype,
      bytes: Uint8Array.from(file.buffer),
    },
  });
  return `/media/${media.id}`;
}

export async function readImage(id: number) {
  if (!Number.isInteger(id) || id < 1) {
    return null;
  }
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media || !extensions[media.mimeType]) {
    return null;
  }
  return media;
}
