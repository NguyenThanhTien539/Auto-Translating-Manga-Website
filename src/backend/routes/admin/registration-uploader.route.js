const route = require("express").Router();

const registrationUploaderController = require("../../controllers/admin/registration-uploader.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

route.get(
  "/list",
  authMiddleware.adminAuth,
  registrationUploaderController.list
);

route.get(
  "/detail/:id",
  authMiddleware.adminAuth,
  registrationUploaderController.detail
);

route.patch(
  "/update-status/:id",
  authMiddleware.adminAuth,
  registrationUploaderController.updateStatus
);


module.exports = route;
