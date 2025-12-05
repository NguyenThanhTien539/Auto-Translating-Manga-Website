const route = require("express").Router();

const mangaController = require("../../controllers/client/manga.controller");

route.get("/", mangaController);

module.exports = route;
