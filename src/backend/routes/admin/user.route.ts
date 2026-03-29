import { Router } from "express";
import * as userController from "../../controllers/admin/user.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.use(authMiddleware.adminAuth);

route.get("/", userController.list);

route.get("/:id", userController.detail);

route.patch("/:id", userController.update);

export default route;
