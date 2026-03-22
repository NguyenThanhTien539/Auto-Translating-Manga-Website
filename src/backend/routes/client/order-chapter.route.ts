import { Router } from "express";
import * as orderController from "../../controllers/client/order.controller";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.post(
  "/payment-chapter",
  authMiddleware.clientAuth,
  orderController.paymentChapter,
);

export default route;
