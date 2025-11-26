const db = require("../config/database.config");

module.exports.insertOtpAndEmail = async (email, otp) => {
  return db("otp_codes").insert({ email: email, otp: otp });
};

module.exports.findEmail = async (email) => {
  return db("otp_codes").select("*").where({ email }).first();
};

module.exports.findEmailAndOtp = async (email, otp) => {
  return db("otp_codes").select("*").where({ email, otp }).first();
};

module.exports.deleteExpiredOTP = async () => {
  return db("otp_codes").where("otp_expiry", "<", db.fn.now()).del();
};

module.exports.deleteOtpByEmail = async (email) => {
  return db("otp_codes").where({ email }).del();
};