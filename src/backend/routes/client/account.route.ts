import { Router } from "express";
import * as accountController from "../../controllers/client/account.controller";
import * as accountValidate from "../../validate/client/account.validate";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.post("/register", accountValidate.register, accountController.register);

route.post(
  "/register/verify-otp",
  authMiddleware.verifyRegisterChallenge,
  accountController.registerVerify,
);

route.post("/forgot-password", accountController.forgotPassword);

route.post(
  "/forgot-password/verify-otp",
  authMiddleware.verifyForgotPasswordChallenge,
  accountController.forgotPasswordVerify,
);

route.post(
  "/reset-password",
  authMiddleware.verifyForgotPasswordChallenge,
  accountController.resetPassword,
);

route.post("/login", accountValidate.login, accountController.login);

route.post("/google-login", accountController.googleLogin);

export default route;
