const orderModel = require("../../models/order.model");


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
