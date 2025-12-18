const route = require("express").Router();
const mangaController = require("../../controllers/admin/manga.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

route.get("/list", authMiddleware.adminAuth, mangaController.getListManga);

route.patch(
  "/update-manga-status/:id",
  authMiddleware.adminAuth,
  mangaController.updateStatusManga
);

route.patch(
  "/update-chapter-status/:id",
  authMiddleware.adminAuth,
  mangaController.updateStatusChapter
);

route.patch(
  "/reject/:id",
  authMiddleware.adminAuth,
  mangaController.rejectManga
);

module.exports = route;
