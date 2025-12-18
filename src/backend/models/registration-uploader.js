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

module.exports.updateRequestStatus = async (request_id, request_status, updated_at) => {
  // trả về user_id
  return db("uploader_requests")
    .where("request_id", request_id)
    .update({ request_status, updated_at });
};

module.exports.checkExistingRequest = async (user_id) => {
  // request_status = pending
  return db("uploader_requests")
    .where("user_id", user_id)
    .andWhere("request_status", "pending")
    .first();
};
