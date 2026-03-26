import { Router } from "express";
import * as authController from "../../controllers/client/auth.controller";
import * as accountController from "../../controllers/client/account.controller";

const route = Router();

route.get("/check", authController.check);

route.get("/logout", authController.logout);

route.post("/refresh-token", accountController.refreshToken);

export default route;
