import { Router } from "express";
import * as registrationUploaderController from "../../controllers/admin/registration-uploader.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.use(authMiddleware.adminAuth);

route.get("/", registrationUploaderController.list);

route.get("/:id", registrationUploaderController.detail);

route.patch("/:id/status", registrationUploaderController.updateStatus);

export default route;
