import { Router } from "express";
import * as authController from "../../controllers/client/auth.controller";

const route = Router();

route.get("/check", authController.check);

route.get("/logout", authController.logout);

export default route;
