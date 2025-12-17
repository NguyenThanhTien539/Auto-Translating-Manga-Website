const route = require("express").Router();
const multer = require("multer");
const mangaController = require("../../controllers/client/manga.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


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


route.get("/all", mangaController.getAllMangas);

route.get("/detail/:id", mangaController.getMangaDetail);

route.get("/chapter/:id/pages", mangaController.getChapterPages);


module.exports = route;
