const route = require("express").Router();

const orderController = require("../../controllers/client/order.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

route.post(
  "/payment-chapter",
  authMiddleware.clientAuth,
  orderController.paymentChapter
);

module.exports = route;
