const db = require("../config/database.config");

module.exports.insertAccount = async (data) => {
  await db("users").insert(data);
};

module.exports.findEmail = async (email) => {
  return db("users").select("*").where({ email }).first();
};

module.exports.findEmailAndId = async (email, id) => {
  return db("users").select("*").where({ email, id }).first();
};

module.exports.findPassword = async (password) => {
  return db("users").select("*").where({ password }).first();
};

module.exports.countAccounts = async () => {
  const result = await db("users").count("user_id as count").first();
  return result.count;
};

module.exports.updatePassword = async (email, newPassword) => {
  return db("users").where({ email: email }).update({ password: newPassword });
};
