import { Response } from "express";
import moment from "moment";
import axios from "axios";
import CryptoJS from "crypto-js";
import * as orderModel from "../../models/order.model";
import * as accountModel from "../../models/account.model";
import { AuthRequest } from "../../types";

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  const coinPackage = await orderModel.getAllCoinPackages();
  res.json({ code: "success", coinPackages: coinPackage });
};

export const detail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  try {
    const orderDetail = await orderModel.getOrderDetailById(Number(id));
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
    const orderDetail = await orderModel.getOrderDetailById(Number(orderCode));
    const config = {
      app_id: "2554",
      key1: process.env.ZALOPAY_KEY1!,
      key2: process.env.ZALOPAY_KEY2!,
      endpoint: process.env.ZALOPAY_ENDPOINT!,
    };

    const embed_data = {
      redirecturl: `${process.env.ZALOPAY_RETURN_URL}/order-coin/success?depositId=${depositId}`,
    };
    const items = [{}];
    const transID = Math.floor(Math.random() * 1000000);
    const order: Record<string, any> = {
      app_id: config.app_id,
      app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
      app_user: `${req.infoUser!.email} - ${orderCode}`,
      app_time: Date.now(),
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount: orderDetail?.price,
      description: `Thanh toán gói nạp ${orderDetail?.coins} coin - Mã đơn hàng: ${orderCode}`,
      bank_code: "",
      callback_url: `${process.env.ZALOPAY_RETURN_URL}/api/order-coin/payment-zalopay-result?depositId=${depositId}`,
    };

    const data =
      config.app_id +
      "|" +
      order.app_trans_id +
      "|" +
      order.app_user +
      "|" +
      order.amount +
      "|" +
      order.app_time +
      "|" +
      order.embed_data +
      "|" +
      order.item;
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    const response = await axios.post(config.endpoint, null, { params: order });
    if (response.data.return_code === 1) {
      res.json({
        code: "success",
        message: "Thành công tạo yêu cầu thanh toán ZaloPay.",
        paymentUrl: response.data.order_url,
      });
    }
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
  const config = {
    key2: process.env.ZALOPAY_KEY2!,
  };
  let result: Record<string, any> = {};
  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    let mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();

    if (reqMac !== mac) {
      let dataJson = JSON.parse(dataStr);
      const [email, orderId] = dataJson.app_user.split(" - ");
      const { depositId } = req.query;
      await orderModel.updateDepositStatus(Number(depositId), "Failed");

      result.return_code = -1;
      result.return_message = "mac not equal";
    } else {
      let dataJson = JSON.parse(dataStr);
      const [email, orderId] = dataJson.app_user.split(" - ");
      const existedRecord = await accountModel.findEmail(email);
      const { depositId } = req.query;
      await orderModel.updateDepositStatus(Number(depositId), "Success");

      const packageDetail = await orderModel.getOrderDetailById(
        Number(orderId),
      );

      if (existedRecord && packageDetail) {
        await accountModel.updateCoinById(
          existedRecord.user_id,
          existedRecord.coin_balance + packageDetail.coins,
        );

        await orderModel.createCoinHistory(
          existedRecord.user_id,
          packageDetail.coins,
          "Deposit",
        );
      }

      result.return_code = 1;
      result.return_message = "success";
    }
  } catch (ex: any) {
    result.return_code = 0;
    result.return_message = ex.message;
  }
};

export const paymentChapter = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { user_id } = req.infoUser!;
    req.body.user_id = user_id;
    await orderModel.orderChapter(req.body);
    await accountModel.updateCoinById(
      req.infoUser!.user_id,
      req.infoUser!.coin_balance - parseInt(req.body.price_at_purchase),
    );
    await orderModel.createCoinHistory(
      req.infoUser!.user_id,
      req.body.price_at_purchase,
      "Purchase",
    );

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
    const paymentDetail = await orderModel.getOrderDetailByCode(orderCode as string);
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
    const finalData = {
      user_id: req.infoUser!.user_id,
      coin_package_id: Number(orderCode),
      payment_method: String(payment_method),
      status: "Pending",
    };
    const depositId = await orderModel.createNewDeposit(finalData);
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
    const { user_id } = req.infoUser!;
    const { depositId } = req.query;
    const history = await orderModel.getDepositHistoryByUserId(
      user_id,
      Number(depositId),
    );

    res.json({ code: "success", history: history[0] });
  } catch (error) {
    res.json({ code: "error", message: "Thất bại lấy lịch sử nạp coin." });
  }
};
