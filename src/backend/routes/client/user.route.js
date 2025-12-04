const route = require("express").Router();

const userController = require("../../controllers/client/user.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const multer = require("multer");
const { storage } = require("../../helper/cloudinary.helper");

const upload = multer({ storage: storage });

route.patch(
  "/profile",
  authMiddleware.clientAuth,
  upload.single("avatar"),
  userController.profile
);

module.exports = route;
