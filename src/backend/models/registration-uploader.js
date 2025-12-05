const db = require("../config/database.config");

module.exports.insertReason = async (user_id, reason) => {
  return db("uploader_requests").insert({ user_id, reason });
};

module.exports.findAllRequestDetails = async () => {
  return db("uploader_requests")
    .select("*")
    .join("users", "uploader_requests.user_id", "users.user_id");
};

module.exports.findRequestDetailById = async (request_id) => {
  return db("uploader_requests")
    .select("*")
    .join("users", "uploader_requests.user_id", "users.user_id")
    .where("uploader_requests.request_id", request_id)
    .first();
};
