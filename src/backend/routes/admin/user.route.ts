import { Router } from "express";
import * as userController from "../../controllers/admin/user.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.get("/list", authMiddleware.adminAuth, userController.list);

route.get("/detail/:id", authMiddleware.adminAuth, userController.detail);

route.patch("/update/:id", authMiddleware.adminAuth, userController.update);

export default route;
