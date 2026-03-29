import { Router } from "express";
import * as mangaController from "../../controllers/admin/manga.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.get("/", authMiddleware.adminAuth, mangaController.getListManga);

route.patch(
  "/:id/status",
  authMiddleware.adminAuth,
  mangaController.updateStatusManga,
);

route.patch(
  "/chapters/:id/status",
  authMiddleware.adminAuth,
  mangaController.updateStatusChapter,
);

route.patch(
  "/:id/reject",
  authMiddleware.adminAuth,
  mangaController.rejectManga,
);

route.get(
  "/chapters/:id/pages",
  authMiddleware.adminAuth,
  mangaController.getChapterPages,
);

route.get("/:id", authMiddleware.adminAuth, mangaController.getMangaDetail);

route.patch(
  "/:id/highlight",
  authMiddleware.adminAuth,
  mangaController.setHighlightManga,
);

export default route;
