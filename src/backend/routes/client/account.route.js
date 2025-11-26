const route = require("express").Router();

const accountController = require("../../controllers/client/account.controller");
const accountValidate = require("../../validate/client/account.validate");
const authMiddleware = require("../../middlewares/auth.middleware");

route.post("/register", accountValidate.register, accountController.register);

route.post(
  "/verify-register",
  authMiddleware.verifyOTPToken,
  accountController.registerVerify
);

route.post("/forgot-password", accountController.forgotPassword);

route.post(
  "/verify-forgot-password",
  authMiddleware.verifyOTPToken,
  accountController.forgotPasswordVerify
);

route.post(
  "/reset-password",
  authMiddleware.verifyOTPToken,
  accountController.resetPassword
);

route.post("/login", accountValidate.login, accountController.login);

module.exports = route;
