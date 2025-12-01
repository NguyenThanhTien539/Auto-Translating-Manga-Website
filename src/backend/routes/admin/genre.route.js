const route = require("express").Router();

const genreController = require("../../controllers/admin/genre.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

route.post("/create", authMiddleware.adminAuth, genreController.create);

module.exports = route;
