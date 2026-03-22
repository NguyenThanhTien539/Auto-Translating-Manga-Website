import { Router } from "express";
import * as userController from "../../controllers/client/user.controller";
import multer from "multer";
import { storage } from "../../helper/cloudinary.helper";

const route = Router();
const upload = multer({ storage: storage });

route.patch("/profile", upload.single("avatar"), userController.profile);

route.post("/register-uploader", userController.registerUploader);

export default route;
