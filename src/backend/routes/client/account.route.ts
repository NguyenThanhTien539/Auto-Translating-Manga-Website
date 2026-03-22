import { Router } from "express";
import * as accountController from "../../controllers/client/account.controller";
import * as accountValidate from "../../validate/client/account.validate";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.post("/register", accountValidate.register, accountController.register);

route.post(
  "/verify-register",
  authMiddleware.verifyOTPToken,
  accountController.registerVerify,
);

route.post("/forgot-password", accountController.forgotPassword);

route.post(
  "/verify-forgot-password",
  authMiddleware.verifyOTPToken,
  accountController.forgotPasswordVerify,
);

route.post(
  "/reset-password",
  authMiddleware.verifyOTPToken,
  accountController.resetPassword,
);

route.post("/login", accountValidate.login, accountController.login);

export default route;
