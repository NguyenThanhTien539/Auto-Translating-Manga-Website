import { Router } from "express";
import * as mangaController from "../../controllers/admin/manga.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.get("/list", authMiddleware.adminAuth, mangaController.getListManga);

route.patch(
  "/update-manga-status/:id",
  authMiddleware.adminAuth,
  mangaController.updateStatusManga,
);

route.patch(
  "/update-chapter-status/:id",
  authMiddleware.adminAuth,
  mangaController.updateStatusChapter,
);

route.patch(
  "/reject/:id",
  authMiddleware.adminAuth,
  mangaController.rejectManga,
);

route.get(
  "/detail/:id",
  authMiddleware.adminAuth,
  mangaController.getMangaDetail,
);

route.get("/chapter/:id/pages", mangaController.getChapterPages);

route.patch(
  "/set-highlight/:id",
  authMiddleware.adminAuth,
  mangaController.setHighlightManga,
);

export default route;
