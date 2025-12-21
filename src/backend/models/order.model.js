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

module.exports.getOrderDetailByCode = async (orderCode) => {
  return db("deposit_transactions")
    .select("*")
    .where({ order_code: orderCode })
    .first();
};

module.exports.createNewDeposit = async (finalData) => {
  const [row] = await db("deposit_transactions")
    .insert(finalData)
    .returning("deposit_id"); // <-- bắt buộc với Postgres

  return row.deposit_id;
};

module.exports.updateDepositStatus = (depositId, status) => {
  return db("deposit_transactions")
    .where({ deposit_id: depositId })
    .update({ status: status });
};

module.exports.getDepositHistoryByUserId = async (user_id, deposit_id) => {
  const q = db("deposit_transactions")
    .join(
      "coin_packages",
      "deposit_transactions.coin_package_id",
      "coin_packages.id"
    )
    .where("user_id", user_id)
    .andWhere("deposit_transactions.deposit_id", deposit_id)
    .andWhere("status", "Success");

  return q;
};
