const route = require("express").Router();
const controller = require("../../controllers/admin/manga.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Áp dụng middleware adminAuth cho tất cả các route này
route.get("/list", authMiddleware.adminAuth, controller.getListManga);
route.patch("/approve/:id", authMiddleware.adminAuth, controller.approveManga);
route.patch("/reject/:id", authMiddleware.adminAuth, controller.rejectManga);

module.exports = route;
