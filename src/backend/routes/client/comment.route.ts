import { Router } from "express";
import * as commentController from "../../controllers/client/comment.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.post("/add", authMiddleware.clientAuth, commentController.add);

route.get("/list", commentController.list);

export default route;
