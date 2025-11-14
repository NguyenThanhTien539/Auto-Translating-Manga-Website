const db = require("../config/database.config");

module.exports.insertAccount = async (data) => {
  await db("users").insert(data);
};

module.exports.findEmail = async (email) => {
  return db("users").select("*").where({ email }).first();
};

module.exports.findPassword = async (password) => {
  return db("users").select("*").where({ password }).first();
};

