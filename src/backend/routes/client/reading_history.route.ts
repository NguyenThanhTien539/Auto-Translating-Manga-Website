import { Router } from "express";
import * as readingHistoryController from "../../controllers/client/reading_history.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.post(
  "/add",
  authMiddleware.clientAuth,
  readingHistoryController.addReadingHistory,
);

route.get(
  "/",
  authMiddleware.clientAuth,
  readingHistoryController.getReadingHistory,
);

route.get(
  "/chapter/:chapterId",
  authMiddleware.clientAuth,
  readingHistoryController.getReadingHistoryByChapter,
);

export default route;
