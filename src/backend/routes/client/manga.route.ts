import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as mangaController from "../../controllers/client/manga.controller";
import * as translateController from "../../controllers/client/request_translate_manga.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";
import * as chapterMiddleware from "../../middlewares/chapter.middleware";
import * as mangaValidate from "../../validate/client/manga.validate";
import { randomUUID } from "crypto";
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

const TMP_ZIP_DIR = path.resolve(__dirname, "../../storage/tmp/zips");

if (!fs.existsSync(TMP_ZIP_DIR)) {
  fs.mkdirSync(TMP_ZIP_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TMP_ZIP_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".bin";
      const uniqueName = ` ${randomUUID()}${ext}`;
      cb(null, uniqueName);
    },
  }),
});

route.get(
  "/my-mangas",
  authMiddleware.uploaderAuth,
  mangaController.getMyMangas,
);

route.get("/languages", mangaController.getLanguages);

route.post(
  "/upload",
  authMiddleware.uploaderAuth,
  upload.fields([
    { name: "cover_image", maxCount: 1 },
    { name: "chapter_zip", maxCount: 1 },
  ]),
  mangaValidate.uploadManga,
  mangaController.uploadManga,
);

route.post(
  "/upload-chapter",
  authMiddleware.uploaderAuth,
  upload.fields([
    { name: "chapter_zip", maxCount: 1 },
    { name: "file_content", maxCount: 1 },
  ]),
  mangaController.uploadChapter,
);

route.get("/", mangaController.listMangas);

route.get("/chapter/:id/detail", mangaController.getChapterDetailOfClient);

route.get(
  "/chapter/:id/pages",
  authMiddleware.optionalAuth,
  chapterMiddleware.checkChapterAccessOptional,
  mangaController.getChapterPages,
);

route.get("/page-image/:pageId", mangaController.getPageImage);

route.get("/filter", rateLimit(50, 60000), mangaController.filterMangas);

route.get(
  "/filterPanelData",
  rateLimit(50, 60000),
  mangaController.getFilterPanelData,
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

route.get(
  "/:slug/chapters",
  authMiddleware.optionalAuth,
  mangaController.getPublicMangaChaptersBySlug,
);
route.get("/:slug", mangaController.getPublicMangaOverviewBySlug);

export default route;
