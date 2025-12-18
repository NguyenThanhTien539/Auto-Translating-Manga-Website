const route = require("express").Router();

const genreController = require("../../controllers/admin/genre.controller");
const authMiddleware = require("../../middlewares/auth.middleware");  

route.post("/create", authMiddleware.adminAuth, genreController.create);

route.get("/list", authMiddleware.adminAuth, genreController.list);

route.get("/detail/:id", authMiddleware.adminAuth, genreController.detail);

route.patch("/edit/:id", authMiddleware.adminAuth, genreController.edit);

module.exports = route;
