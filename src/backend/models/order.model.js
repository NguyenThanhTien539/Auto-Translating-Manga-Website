const db = require("../config/database.config");

module.exports.getAllCoinPackages = async () => {
  return db("coin_packages").select("*").where({ is_active: true });
};

module.exports.getOrderDetailById = async (id) => {
  return db("coin_packages").select("*").where({ id: id }).first();
};
