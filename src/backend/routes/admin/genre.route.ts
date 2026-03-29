import { Router } from "express";
import * as genreController from "../../controllers/admin/genre.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.use(authMiddleware.adminAuth);

route.post("/", genreController.create);

route.get("/", genreController.list);

route.get("/:id", genreController.detail);

route.patch("/:id", genreController.edit);

export default route;
