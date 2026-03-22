import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import * as mangaController from "../../controllers/client/manga.controller";
import * as translateController from "../../controllers/client/request_translate_manga.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";
import * as chapterMiddleware from "../../middlewares/chapter.middleware";

const route = Router();

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

const rateLimit = (limit: number = 100, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || (req.connection as any).remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = rateLimitMap.get(key)!;

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    if (record.count >= limit) {
      res.status(429).json({
        code: "error",
        message: "Too many requests, please try again later",
      });
      return;
    }

    record.count++;
    next();
  };
};

const upload = multer({ storage: multer.memoryStorage() });

route.get(
  "/my-mangas",
  authMiddleware.uploaderAuth,
  mangaController.getMyMangas,
);

route.get("/languages", mangaController.getLanguages);

route.get("/genres", mangaController.getGenres);

route.post(
  "/upload",
  authMiddleware.uploaderAuth,
  upload.fields([
    { name: "cover_image", maxCount: 1 },
    { name: "file_content", maxCount: 1 },
  ]),
  mangaController.uploadManga,
);

route.post(
  "/upload-chapter",
  authMiddleware.uploaderAuth,
  upload.fields([{ name: "file_content", maxCount: 1 }]),
  mangaController.uploadChapter,
);

route.get("/all", mangaController.getAllMangasOfClient);

route.post("/detail/:id", mangaController.getMangaDetailOfClient);

route.get(
  "/chapter/:id/pages",
  authMiddleware.optionalAuth,
  chapterMiddleware.checkChapterAccessOptional,
  mangaController.getChapterPages,
);

route.get("/page-image/:pageId", mangaController.getPageImage);

route.get("/detail", mangaController.getMangaAndSpecificChapter);

route.get("/filter", rateLimit(50, 60000), mangaController.filterMangas);

route.get(
  "/filterPanelData",
  rateLimit(50, 60000),
  mangaController.getFilterPanelData,
);

route.post(
  "/favorite",
  authMiddleware.clientAuth,
  mangaController.favoriteManga,
);

route.get(
  "/favorite-list",
  authMiddleware.clientAuth,
  mangaController.getFavoriteMangaList,
);

route.get(
  "/check-favorite",
  authMiddleware.clientAuth,
  mangaController.checkFavoriteManga,
);

route.get(
  "/statistics",
  authMiddleware.clientAuth,
  mangaController.getMangaStatistics,
);

route.post(
  "/translate-page",
  rateLimit(10, 60000),
  translateController.translateSinglePage,
);

export default route;
