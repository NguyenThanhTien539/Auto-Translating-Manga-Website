const route = require("express").Router();
const multer = require("multer");
const mangaController = require("../../controllers/client/manga.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

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
        message: "Too many requests, please try again later" 
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

route.get("/detail/:id", mangaController.getMangaDetailOfClient);

route.get("/chapter/:id/pages", mangaController.getChapterPages);

route.get("/detail", mangaController.getMangaAndSpecificChapter);

module.exports = route;
