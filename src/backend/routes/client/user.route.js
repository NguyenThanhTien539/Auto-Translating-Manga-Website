const route = require("express").Router();

const userController = require("../../controllers/client/user.controller");
const multer = require("multer");
const { storage } = require("../../helper/cloudinary.helper");

const upload = multer({ storage: storage });

route.patch(
  "/profile",
  upload.single("avatar"),
  userController.profile
);

route.post("/register-uploader",
  userController.registerUploader
);


module.exports = route;
