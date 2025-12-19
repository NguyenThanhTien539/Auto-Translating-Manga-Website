const db = require("../config/database.config");

module.exports.getAllCoinPackages = async () => {
  return db("coin_packages").select("*").where({ is_active: true });
};

module.exports.getOrderDetailById = async (id) => {
  return db("coin_packages").select("*").where({ id: id }).first();
};

module.exports.createOrder = async (orderData) => {
  return db("deposit_transactions").insert(orderData);
};

module.exports.orderChapter = async (orderData) => {
  return db("purchased_chapters").insert(orderData);
};

module.exports.createCoinHistory = async (user_id, amount, type) => {
  return db("coin_history").insert({ user_id, amount, type });
};
