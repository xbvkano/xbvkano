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
} from "../content.js";
import { courseworkCatalog } from "../coursework.js";
import { mediaUpload, saveImage } from "../media.js";
import { requireSessionOrToken } from "../require-access.js";

export const manageRouter = Router();

manageRouter.use(requireSessionOrToken);

manageRouter.get(
  "/portfolio",
  asyncHandler(async (_req, res) => {
    const portfolio = await loadPortfolio();
    res.json({ ...portfolio, coursework: courseworkCatalog() });
  }),
);

manageRouter.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    res.json(await updateProfile(req.body));
  }),
);

manageRouter.post(
  "/entries",
  asyncHandler(async (req, res) => {
    res.status(201).json(await createEntry(req.body));
  }),
);

manageRouter.post(
  "/entries/:id/move",
  asyncHandler(async (req, res) => {
    await moveEntry(parseId(req.params.id), req.body);
    res.status(204).end();
  }),
);

manageRouter.patch(
  "/entries/:id",
  asyncHandler(async (req, res) => {
    res.json(await updateEntry(parseId(req.params.id), req.body));
  }),
);

manageRouter.delete(
  "/entries/:id",
  asyncHandler(async (req, res) => {
    await deleteEntry(parseId(req.params.id));
    res.status(204).end();
  }),
);

manageRouter.post(
  "/skills",
  asyncHandler(async (req, res) => {
    res.status(201).json(await createSkill(req.body));
  }),
);

manageRouter.patch(
  "/skills/:id",
  asyncHandler(async (req, res) => {
    res.json(await updateSkill(parseId(req.params.id), req.body));
  }),
);

manageRouter.delete(
  "/skills/:id",
  asyncHandler(async (req, res) => {
    await deleteSkill(parseId(req.params.id));
    res.status(204).end();
  }),
);

manageRouter.post(
  "/references",
  asyncHandler(async (req, res) => {
    res.status(201).json(await createReference(req.body));
  }),
);

manageRouter.patch(
  "/references/:id",
  asyncHandler(async (req, res) => {
    res.json(await updateReference(parseId(req.params.id), req.body));
  }),
);

manageRouter.delete(
  "/references/:id",
  asyncHandler(async (req, res) => {
    await deleteReference(parseId(req.params.id));
    res.status(204).end();
  }),
);

manageRouter.get(
  "/applications",
  asyncHandler(async (_req, res) => {
    res.json(await loadApplications());
  }),
);

manageRouter.post(
  "/applications",
  asyncHandler(async (req, res) => {
    res.status(201).json(await createApplication(req.body));
  }),
);

manageRouter.patch(
  "/applications/:id",
  asyncHandler(async (req, res) => {
    res.json(await updateApplication(parseId(req.params.id), req.body));
  }),
);

manageRouter.delete(
  "/applications/:id",
  asyncHandler(async (req, res) => {
    await deleteApplication(parseId(req.params.id));
    res.status(204).end();
  }),
);

manageRouter.post("/media", (req, res, next) => {
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
