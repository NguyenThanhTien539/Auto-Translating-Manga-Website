const route = require("express").Router();
const multer = require("multer");
const mangaController = require("../../controllers/client/manga.controller");
const translateController = require("../../controllers/client/request_translate_manga.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const chapterMiddleware = require("../../middlewares/chapter.middleware");

// Simple in-memory rate limiter
const rateLimitMap = new Map();
const rateLimit = (limit = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = rateLimitMap.get(key);

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    if (record.count >= limit) {
      return res.status(429).json({
        code: "error",
        message: "Too many requests, please try again later",
      });
    }

    record.count++;
    next();
  };
};

// Configure multer for memory storage (to handle zip processing)
const upload = multer({ storage: multer.memoryStorage() });

// Route to get mangas for the uploader (for the select box)
route.get(
  "/my-mangas",
  authMiddleware.uploaderAuth,
  mangaController.getMyMangas
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
  mangaController.uploadManga
);

route.post(
  "/upload-chapter",
  authMiddleware.uploaderAuth,
  upload.fields([{ name: "file_content", maxCount: 1 }]),
  mangaController.uploadChapter
);

route.get("/all", mangaController.getAllMangasOfClient);

// route.get(
//   "/detail/:id",
//   // authMiddleware.clientAuth,
//   mangaController.getMangaDetailOfClient
// );
route.post(
  "/detail/:id",
  // authMiddleware.clientAuth,
  mangaController.getMangaDetailOfClient
);

route.get(
  "/chapter/:id/pages",
  authMiddleware.optionalAuth,
  chapterMiddleware.checkChapterAccessOptional,
  mangaController.getChapterPages
);

route.get("/page-image/:pageId", mangaController.getPageImage); // fix dong nay de truyen doc duoc vi no ngu

route.get("/detail", mangaController.getMangaAndSpecificChapter);

route.get("/filter", rateLimit(50, 60000), mangaController.filterMangas);

route.get(
  "/filterPanelData",
  rateLimit(50, 60000),
  mangaController.getFilterPanelData
);

route.post(
  "/favorite",
  authMiddleware.clientAuth,
  mangaController.favoriteManga
);

route.get(
  "/favorite-list",
  authMiddleware.clientAuth,
  mangaController.getFavoriteMangaList
);

route.get(
  "/check-favorite",
  authMiddleware.clientAuth,
  mangaController.checkFavoriteManga
);

route.get(
  "/statistics",
  authMiddleware.clientAuth,
  mangaController.getMangaStatistics
);

// Translation endpoint
route.post(
  "/translate-page",
  rateLimit(10, 60000), // Limit to 10 requests per minute
  translateController.translateSinglePage
);

module.exports = route;
