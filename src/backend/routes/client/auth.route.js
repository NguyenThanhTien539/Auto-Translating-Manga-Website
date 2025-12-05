const route = require("express").Router();

const authController = require("../../controllers/client/auth.controller");

route.get("/check", authController.check);

route.get("/logout", authController.logout);

module.exports = route;
