const route = require("express").Router();
const readingHistoryController = require("../../controllers/client/reading_history.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

route.post(
  "/add",
  authMiddleware.clientAuth,
  readingHistoryController.addReadingHistory
);
route.get(
  "/",
  authMiddleware.clientAuth,
  readingHistoryController.getReadingHistory
);
route.get(
  "/manga/:mangaId",
  authMiddleware.clientAuth,
  readingHistoryController.getReadingHistoryByManga
);

module.exports = route;
