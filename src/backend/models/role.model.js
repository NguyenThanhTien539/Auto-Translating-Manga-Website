const db = require("../config/database.config");

module.exports.findById = async (role_id) => {
  return db("role").select("*").where({ role_id }).first();
};
