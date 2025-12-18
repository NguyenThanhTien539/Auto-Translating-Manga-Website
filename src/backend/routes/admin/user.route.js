const route = require("express").Router();

const userController = require("../../controllers/admin/user.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

route.get("/list", authMiddleware.adminAuth, userController.list);

route.get("/detail/:id", authMiddleware.adminAuth, userController.detail);

route.patch("/update/:id", authMiddleware.adminAuth, userController.update);

module.exports = route;
  