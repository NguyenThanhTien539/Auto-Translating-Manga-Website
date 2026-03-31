import moment from "moment";
import axios from "axios";
import CryptoJS from "crypto-js";
import * as orderModel from "../../models/order.model";
import * as accountModel from "../../models/account.model";

export const list = async (): Promise<any> => {
  return orderModel.getAllCoinPackages();
};

export const detail = async (id: number): Promise<any> => {
  return orderModel.getOrderDetailById(id);
};

export const paymentZaloPay = async (
  orderCode: number,
  depositId: number,
  email: string,
): Promise<string> => {
  const orderDetail = await orderModel.getOrderDetailById(orderCode);
  const config = {
    app_id: "2554",
    key1: process.env.ZALOPAY_KEY1!,
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
    app_user: `${email} - ${orderCode}`,
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
  if (response.data.return_code !== 1) {
    throw new Error("Thất bại tạo yêu cầu thanh toán ZaloPay.");
  }

  return response.data.order_url as string;
};

export const paymentZaloPayResult = async (
  dataStr: string,
  reqMac: string,
  depositId: number,
): Promise<{ return_code: number; return_message: string }> => {
  const key2 = process.env.ZALOPAY_KEY2!;

  try {
    const mac = CryptoJS.HmacSHA256(dataStr, key2).toString();

    if (reqMac !== mac) {
      await orderModel.updateDepositStatus(depositId, "Failed");
      return {
        return_code: -1,
        return_message: "mac not equal",
      };
    }

    const dataJson = JSON.parse(dataStr);
    const [email, orderId] = dataJson.app_user.split(" - ");
    const existedRecord = await accountModel.findUserByEmail(email);
    await orderModel.updateDepositStatus(depositId, "Success");

    const packageDetail = await orderModel.getOrderDetailById(Number(orderId));

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

    return {
      return_code: 1,
      return_message: "success",
    };
  } catch (ex: any) {
    return {
      return_code: 0,
      return_message: ex.message,
    };
  }
};

export const paymentChapter = async (input: {
  userId: number;
  coinBalance: number;
  priceAtPurchase: number;
  orderPayload: {
    chapter_id: number;
    price_at_purchase: number;
    [key: string]: unknown;
  };
}): Promise<void> => {
  await orderModel.orderChapter({
    ...input.orderPayload,
    user_id: input.userId,
  });
  await accountModel.updateCoinById(
    input.userId,
    input.coinBalance - input.priceAtPurchase,
  );
  await orderModel.createCoinHistory(
    input.userId,
    input.priceAtPurchase,
    "Purchase",
  );
};

export const detailPayment = async (orderCode: string): Promise<any> => {
  return orderModel.getOrderDetailByCode(orderCode);
};

export const confirmPayment = async (input: {
  user_id: number;
  coin_package_id: number;
  payment_method: string;
}): Promise<number> => {
  const finalData = {
    ...input,
    status: "Pending",
  };
  return orderModel.createNewDeposit(finalData);
};

export const depositHistory = async (
  userId: number,
  depositId: number,
): Promise<any> => {
  const history = await orderModel.getDepositHistoryByUserId(userId, depositId);
  return history[0];
};
