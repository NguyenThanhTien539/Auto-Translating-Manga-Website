import { Response } from "express";
import { AuthRequest } from "../../types";
import * as orderControllerService from "../../services/client/order.service";

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  const coinPackage = await orderControllerService.list();
  res.json({ code: "success", coinPackages: coinPackage });
};

export const detail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  try {
    const orderDetail = await orderControllerService.detail(Number(id));
    res.json({ code: "success", orderDetail: orderDetail });
  } catch (error) {
    res.json({ code: "error", message: "Thất bại lấy chi tiết đơn hàng." });
  }
};

export const paymentZaloPay = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { orderCode, depositId } = req.query;
  try {
    const paymentUrl = await orderControllerService.paymentZaloPay(
      Number(orderCode),
      Number(depositId),
      req.infoUser!.email,
    );
    res.json({
      code: "success",
      message: "Thành công tạo yêu cầu thanh toán ZaloPay.",
      paymentUrl,
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Thất bại tạo yêu cầu thanh toán ZaloPay.",
    });
  }
};

export const paymentZaloPayResult = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await orderControllerService.paymentZaloPayResult(
      req.body.data,
      req.body.mac,
      Number(req.query.depositId),
    );
    res.json(result);
  } catch (error) {
    res.json({ return_code: 0, return_message: "Internal server error" });
  }
};

export const paymentChapter = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await orderControllerService.paymentChapter({
      userId: req.infoUser!.user_id,
      coinBalance: req.infoUser!.coin_balance,
      priceAtPurchase: parseInt(req.body.price_at_purchase),
      orderPayload: {
        ...req.body,
        chapter_id: parseInt(req.body.chapter_id),
        price_at_purchase: parseInt(req.body.price_at_purchase),
      },
    });

    res.json({ code: "success", message: "Mua chapter thành công." });
  } catch (error) {
    res.json({ code: "error", message: "Thất bại mua chapter." });
  }
};

export const detailPayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { orderCode } = req.params;
  try {
    const paymentDetail = await orderControllerService.detailPayment(
      orderCode as string,
    );
    res.json({ code: "success", paymentDetail: paymentDetail });
  } catch (error) {
    res.json({ code: "error", message: "Thất bại lấy chi tiết thanh toán." });
  }
};

export const confirmPayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { orderCode, payment_method } = req.query;
  try {
    const depositId = await orderControllerService.confirmPayment({
      user_id: req.infoUser!.user_id,
      coin_package_id: Number(orderCode),
      payment_method: String(payment_method),
    });

    res.json({
      code: "success",
      message: "Xác nhận thanh toán thành công.",
      depositId: depositId,
    });
  } catch (error) {
    res.json({ code: "error", message: "Thất bại xác nhận thanh toán." });
  }
};

export const depositHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const history = await orderControllerService.depositHistory(
      req.infoUser!.user_id,
      Number(req.query.depositId),
    );

    res.json({ code: "success", history });
  } catch (error) {
    res.json({ code: "error", message: "Thất bại lấy lịch sử nạp coin." });
  }
};
