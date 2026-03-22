import { Router } from "express";
import * as orderController from "../../controllers/client/order.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.get("/list", orderController.list);

route.get("/detail/:id", orderController.detail);

route.get(
  "/payment-zalopay",
  authMiddleware.clientAuth,
  orderController.paymentZaloPay,
);

route.post("/payment-zalopay-result", orderController.paymentZaloPayResult);

route.get("/detail-payment/:orderCode", orderController.detailPayment);

route.get(
  "/confirm-payment",
  authMiddleware.clientAuth,
  orderController.confirmPayment,
);

route.get(
  "/history",
  authMiddleware.clientAuth,
  orderController.depositHistory,
);

export default route;
