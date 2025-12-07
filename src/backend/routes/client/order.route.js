const route = require("express").Router();

const orderController = require("../../controllers/client/order.controller");

route.get("/list", orderController.list);

route.get("/detail/:id", orderController.detail);

module.exports = route;
