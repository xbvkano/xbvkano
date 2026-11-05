import type { Entry, EntryKind } from "@prisma/client";
import { Router } from "express";
import { asyncHandler } from "../async-handler.js";
import { prisma } from "../lib/prisma.js";

function toEntryResponse(entry: Entry) {
  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    subtitle: entry.subtitle,
    shortDescription: entry.shortDescription,
    longDescription: entry.longDescription,
    imagePath: entry.imagePath,
    linkUrl: entry.linkUrl,
    startedOn: entry.startedOn,
    endedOn: entry.endedOn,
    sortOrder: entry.sortOrder,
  };
}

export function entryRouter(kind: EntryKind): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const entries = await prisma.entry.findMany({
        where: { kind },
        orderBy: { sortOrder: "asc" },
      });
      res.json(entries.map(toEntryResponse));
    }),
  );

  router.get(
    "/:slug",
    asyncHandler(async (req, res) => {
      const slug = req.params.slug;
      if (!slug) {
        res.status(400).json({ error: "Missing slug" });
        return;
      }

      const entry = await prisma.entry.findUnique({ where: { slug } });
      if (!entry || entry.kind !== kind) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      res.json(toEntryResponse(entry));
    }),
  );

  return router;
}
