const moment = require("moment");
const axios = require("axios");
const CryptoJS = require("crypto-js");

const orderModel = require("../../models/order.model");
const accountModel = require("../../models/account.model");

module.exports.list = async (req, res) => {
  const coinPackage = await orderModel.getAllCoinPackages();
  res.json({ code: "success", coinPackages: coinPackage }); // Placeholder response
};

module.exports.detail = async (req, res) => {
  const { id } = req.params;
  try {
    const orderDetail = await orderModel.getOrderDetailById(id);
    res.json({ code: "success", orderDetail: orderDetail });
  } catch (error) {
    res.json({ code: "error", message: "Thất bại lấy chi tiết đơn hàng." });
  }
};

module.exports.paymentZaloPay = async (req, res) => {
  const { orderCode, depositId } = req.query;
  try {
    const orderDetail = await orderModel.getOrderDetailById(orderCode);
    const config = {
      app_id: "2554",
      key1: "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
      key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
      endpoint: "https://sb-openapi.zalopay.vn/v2/create",
      // endpoint: "https://openapi.zalopay.vn/v2/create",
    };

    const embed_data = {
      redirecturl: `http://ec2-15-134-37-160.ap-southeast-2.compute.amazonaws.com/order-coin/success?depositId=${depositId}`,
    };
    const items = [{}];
    const transID = Math.floor(Math.random() * 1000000);
    const order = {
      app_id: config.app_id,
      app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
      app_user: `${req.infoUser.email} - ${orderCode}`,
      app_time: Date.now(),
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount: orderDetail.price,
      description: `Thanh toán gói nạp ${orderDetail.coins} coin - Mã đơn hàng: ${orderCode}`,
      bank_code: "",
      callback_url: `http://ec2-15-134-37-160.ap-southeast-2.compute.amazonaws.com/api/order-coin/payment-zalopay-result?depositId=${depositId}`,
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

module.exports.paymentZaloPayResult = async (req, res) => {
  const config = {
    key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
  };
  let result = {};
  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    let mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();

    if (reqMac !== mac) {
      // callback không hợp lệ

      let dataJson = JSON.parse(dataStr, config.key2);
      const [email, orderId] = dataJson.app_user.split(" - ");
      const existedRecord = await accountModel.findEmail(email);
      const finalData = {
        user_id: existedRecord.user_id,
        coin_package_id: orderId,
        payment_method: "ZaloPay",
        status: "Failed",
      };

      if (existedRecord) {
        await orderModel.createOrder(finalData);
      }
      result.return_code = -1;
      result.return_message = "mac not equal";
    } else {
      // thanh toán thành công
      // merchant cập nhật trạng thái cho đơn hàng
      let dataJson = JSON.parse(dataStr, config.key2);
      const [email, orderId] = dataJson.app_user.split(" - ");
      const existedRecord = await accountModel.findEmail(email);
      // const finalData = {
      //   user_id: existedRecord.user_id,
      //   coin_package_id: orderId,
      //   payment_method: "ZaloPay",
      //   status: "Success",
      // };
      const { depositId } = req.query;
      await orderModel.updateDepositStatus(depositId, "Success");

      const packageDetail = await orderModel.getOrderDetailById(orderId);

      await accountModel.updateCoinById(
        existedRecord.user_id,
        existedRecord.coin_balance + packageDetail.coins
      );

      await orderModel.createCoinHistory(
        existedRecord.user_id,
        packageDetail.coins,
        "Deposit"
      );

      result.return_code = 1;
      result.return_message = "success";
    }
  } catch (ex) {
    result.return_code = 0; // ZaloPay server sẽ ca llback lại (tối đa 3 lần)
    result.return_message = ex.message;
  }
};

module.exports.paymentChapter = async (req, res) => {
  try {
    const { user_id } = req.infoUser;
    req.body.user_id = user_id;
    await orderModel.orderChapter(req.body);
    await accountModel.updateCoinById(
      req.infoUser.user_id,
      req.infoUser.coin_balance - parseInt(req.body.price_at_purchase)
    );
    await orderModel.createCoinHistory(
      req.infoUser.user_id,
      req.body.price_at_purchase,
      "Purchase"
    );

    res.json({ code: "success", message: "Mua chapter thành công." });
  } catch (error) {
    res.json({ code: "error", message: "Thất bại mua chapter." });
  }
};

module.exports.detailPayment = async (req, res) => {
  const { orderCode } = req.params;
  try {
    const paymentDetail = await orderModel.getPaymentDetailByOrderCode(
      orderCode
    );
    res.json({ code: "success", paymentDetail: paymentDetail });
  } catch (error) {
    res.json({ code: "error", message: "Thất bại lấy chi tiết thanh toán." });
  }
};

module.exports.confirmPayment = async (req, res) => {
  const { orderCode, payment_method } = req.query;
  try {
    const finalData = {
      user_id: req.infoUser.user_id,
      coin_package_id: orderCode,
      payment_method: payment_method,
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

module.exports.depositHistory = async (req, res) => {
  try {
    const { user_id } = req.infoUser;
    const { depositId } = req.query;
    const history = await orderModel.getDepositHistoryByUserId(
      user_id,
      depositId
    );

    console.log("Deposit history:", history);
    res.json({ code: "success", history: history[0] });
  } catch (error) {
    res.json({ code: "error", message: "Thất bại lấy lịch sử nạp coin." });
  }
};
