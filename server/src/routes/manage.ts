import { Router } from "express";
import { asyncHandler } from "../async-handler.js";
import { ApiError } from "../api-error.js";
import {
  createApplication,
  createEntry,
  createReference,
  createSkill,
  deleteApplication,
  deleteEntry,
  deleteReference,
  deleteSkill,
  loadApplications,
  loadPortfolio,
  parseId,
  moveEntry,
  updateApplication,
  updateEntry,
  updateProfile,
  updateReference,
  updateSkill,
  upsertApplication,
} from "../content.js";
import { courseworkCatalog } from "../coursework.js";
import { loadAssistantNotes, upsertAssistantNote } from "../assistant-notes.js";
import { mediaUpload, saveImage } from "../media.js";
import { requireApplyAccess } from "../require-access.js";
import { requireSession } from "../require-session.js";

export const manageRouter = Router();

manageRouter.get(
  "/portfolio",
  requireApplyAccess,
  asyncHandler(async (_req, res) => {
    const portfolio = await loadPortfolio();
    res.json({ ...portfolio, coursework: courseworkCatalog(), assistantNotes: await loadAssistantNotes() });
  }),
);

manageRouter.patch(
  "/profile",
  requireSession,
  asyncHandler(async (req, res) => {
    res.json(await updateProfile(req.body));
  }),
);

manageRouter.post(
  "/entries",
  requireSession,
  asyncHandler(async (req, res) => {
    res.status(201).json(await createEntry(req.body));
  }),
);

manageRouter.post(
  "/entries/:id/move",
  requireSession,
  asyncHandler(async (req, res) => {
    await moveEntry(parseId(req.params.id), req.body);
    res.status(204).end();
  }),
);

manageRouter.patch(
  "/entries/:id",
  requireSession,
  asyncHandler(async (req, res) => {
    res.json(await updateEntry(parseId(req.params.id), req.body));
  }),
);

manageRouter.delete(
  "/entries/:id",
  requireSession,
  asyncHandler(async (req, res) => {
    await deleteEntry(parseId(req.params.id));
    res.status(204).end();
  }),
);

manageRouter.post(
  "/skills",
  requireSession,
  asyncHandler(async (req, res) => {
    res.status(201).json(await createSkill(req.body));
  }),
);

manageRouter.patch(
  "/skills/:id",
  requireSession,
  asyncHandler(async (req, res) => {
    res.json(await updateSkill(parseId(req.params.id), req.body));
  }),
);

manageRouter.delete(
  "/skills/:id",
  requireSession,
  asyncHandler(async (req, res) => {
    await deleteSkill(parseId(req.params.id));
    res.status(204).end();
  }),
);

manageRouter.post(
  "/references",
  requireSession,
  asyncHandler(async (req, res) => {
    res.status(201).json(await createReference(req.body));
  }),
);

manageRouter.patch(
  "/references/:id",
  requireSession,
  asyncHandler(async (req, res) => {
    res.json(await updateReference(parseId(req.params.id), req.body));
  }),
);

manageRouter.delete(
  "/references/:id",
  requireSession,
  asyncHandler(async (req, res) => {
    await deleteReference(parseId(req.params.id));
    res.status(204).end();
  }),
);

manageRouter.put(
  "/notes",
  requireApplyAccess,
  asyncHandler(async (req, res) => {
    const result = await upsertAssistantNote(req.body);
    res.status(result.created ? 201 : 200).json(result);
  }),
);

manageRouter.get(
  "/notes",
  requireApplyAccess,
  asyncHandler(async (_req, res) => {
    res.json(await loadAssistantNotes());
  }),
);

manageRouter.get(
  "/applications",
  requireApplyAccess,
  asyncHandler(async (_req, res) => {
    res.json(await loadApplications());
  }),
);

manageRouter.put(
  "/applications",
  requireApplyAccess,
  asyncHandler(async (req, res) => {
    const result = await upsertApplication(req.body);
    res.status(result.created ? 201 : 200).json(result);
  }),
);

manageRouter.put(
  "/applications/:id",
  requireApplyAccess,
  asyncHandler(async (req, res) => {
    res.json(await updateApplication(parseId(req.params.id), req.body));
  }),
);

manageRouter.post(
  "/applications",
  requireSession,
  asyncHandler(async (req, res) => {
    res.status(201).json(await createApplication(req.body));
  }),
);

manageRouter.patch(
  "/applications/:id",
  requireSession,
  asyncHandler(async (req, res) => {
    res.json(await updateApplication(parseId(req.params.id), req.body));
  }),
);

manageRouter.delete(
  "/applications/:id",
  requireSession,
  asyncHandler(async (req, res) => {
    await deleteApplication(parseId(req.params.id));
    res.status(204).end();
  }),
);

manageRouter.post("/media", requireSession, (req, res, next) => {
  mediaUpload.single("file")(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }
    if (!req.file) {
      next(new ApiError(400, "Choose an image"));
      return;
    }
    saveImage(req.file)
      .then((imagePath) => {
        res.status(201).json({ imagePath });
      })
      .catch(next);
  });
});
