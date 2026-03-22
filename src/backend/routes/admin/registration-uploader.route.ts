import { Router } from "express";
import * as registrationUploaderController from "../../controllers/admin/registration-uploader.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.get(
  "/list",
  authMiddleware.adminAuth,
  registrationUploaderController.list,
);

route.get(
  "/detail/:id",
  authMiddleware.adminAuth,
  registrationUploaderController.detail,
);

route.patch(
  "/update-status/:id",
  authMiddleware.adminAuth,
  registrationUploaderController.updateStatus,
);

export default route;
