import express from "express";
import * as AuthorController from "../../controllers/admin/author.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";
import multer from "multer";
import { storage } from "../../helper/cloudinary.helper";

const route = express.Router();
const upload = multer({ storage: storage });

route.post("/", authMiddleware.adminAuth, AuthorController.createAuthor);

route.patch(
  "/update/:id",
  authMiddleware.adminAuth,
  upload.single("avatar_url"),
  AuthorController.updateAuthor,
);

route.delete("/:id", authMiddleware.adminAuth, AuthorController.deleteAuthor);

route.get("/all", AuthorController.getAllAuthors);

route.get("/:id", AuthorController.getAuthorById);

route.get("/:id/mangas", AuthorController.getAuthorMangas);

export default route;
