const db = require("../config/database.config");

module.exports.findById = async (role_id) => {
  return db("role").select("*").where({ role_id }).first();
};

module.exports.findByCode = async (role_code) => {
  return db("role").select("*").where({ role_code }).first();
};
