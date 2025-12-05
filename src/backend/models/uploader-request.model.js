const db = require("../config/database.config");

module.exports.insertReason = async (user_id, reason) => {
  return db("uploader_requests").insert({ user_id, reason });
};