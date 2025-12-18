const route = require("express").Router();

const commentController = require("../../controllers/client/comment.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

route.post("/add", authMiddleware.clientAuth, commentController.add);

route.get("/list", commentController.list);

module.exports = route;
