const route = require("express").Router();

const orderController = require("../../controllers/client/order.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

route.get("/list", orderController.list);

route.get("/detail/:id", orderController.detail);

route.get(
  "/payment-zalopay",
  authMiddleware.clientAuth,
  orderController.paymentZaloPay
);

route.post("/payment-zalopay-result", orderController.paymentZaloPayResult);

route.get("/detail-payment/:orderCode", orderController.detailPayment);

route.get(
  "/confirm-payment",
  authMiddleware.clientAuth,
  orderController.confirmPayment
);

route.get(
  "/history",
  authMiddleware.clientAuth,
  orderController.depositHistory
);

module.exports = route;
