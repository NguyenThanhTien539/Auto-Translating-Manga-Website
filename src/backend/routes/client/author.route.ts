import express from "express";
import * as AuthorController from "../../controllers/client/author.controller";

const router = express.Router();

router.get("/", AuthorController.getAllAuthors);

router.get("/:id", AuthorController.getAuthorById);

router.get("/:id/mangas", AuthorController.getAuthorMangas);

export default router;
