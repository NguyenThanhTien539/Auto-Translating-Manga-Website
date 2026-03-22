import { Router } from "express";
import * as genreController from "../../controllers/admin/genre.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.post("/create", authMiddleware.adminAuth, genreController.create);

route.get("/list", authMiddleware.adminAuth, genreController.list);

route.get("/detail/:id", authMiddleware.adminAuth, genreController.detail);

route.patch("/edit/:id", authMiddleware.adminAuth, genreController.edit);

export default route;
