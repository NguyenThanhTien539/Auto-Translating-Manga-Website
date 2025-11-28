const route = require("express").Router();

const authController = require("../../controllers/client/auth.controller");

route.get("/check", authController.check);

module.exports = route;
