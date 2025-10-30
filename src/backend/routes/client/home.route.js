const route = require("express").Router();

const homeController = require("../../controllers/client/home.controller");

route.get("/", homeController.home);

module.exports = route;
