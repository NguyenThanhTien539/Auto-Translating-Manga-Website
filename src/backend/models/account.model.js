const db = require("../config/database.config");

module.exports.insertAccount = async (data) => {
  await db("users").insert(data);
};

module.exports.findEmail = async (email) => {
  return db("users").select("*").where({ email }).first();
};
module.exports.findId = async (user_id) => {
  return db("users").select("*").where({ user_id }).first();
};

module.exports.findEmailAndId = async (email, id) => {
  return db("users").select("*").where({ email, id }).first();
};
module.exports.findAminAuthToken = async (user_id, email, role_id) => {
  return db("users").select("*").where({ user_id, email, role_id }).first();
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


module.exports.updateProfile = async (user_id, data) => {
  return db("users").where({ user_id: user_id }).update(data);
}

module.exports.checkUsernameExists = async (username) => {
  return db("users").select("*").where({ username }).first();
}