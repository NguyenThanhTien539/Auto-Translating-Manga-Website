const jwt = require("jsonwebtoken");
const VerifyModel = require("../models/verify.model");
const accountModel = require("../models/account.model");

module.exports.verifyOTPToken = async (req, res, next) => {
  let email;
  try {
    const verified_otp_token = req.cookies.verified_otp_token;
    const decodedData = jwt.verify(verified_otp_token, process.env.JWT_SECRET);
    email = decodedData.email;
    await VerifyModel.deleteExpiredOTP();
    const existedRecord = await VerifyModel.findEmailAndOtp(
      decodedData.email,
      decodedData.otp
    );

    if (!existedRecord) {
      res.clearCookie("verified_otp_token");
      res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
    }

    if (decodedData.email && decodedData.password && decodedData.fullName) {
      req.infoUser = {
        email: decodedData.email,
        password: decodedData.password,
        fullName: decodedData.fullName,
      };
    } else {
      req.email = decodedData.email;
    }

    next();
  } catch (error) {
    if (email) {
      await VerifyModel.deleteOtpByEmail(email);
    }

    res.clearCookie("verified_otp_token");
    res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
  }
};

module.exports.adminAuth = async (req, res, next) => {
  try {
    const authToken = req.cookies.accessToken;
    const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);
    email = decodedData.email;

    const existedRecord = await acc.findAdminAuthToken(
      decodedData.email,
      decodedData.id,
      decodedData.role
    );

    if (!existedRecord) {
      res.clearCookie("accessToken");
      res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
    }

    req.infoStaff = existedRecord;

    next();
  } catch (error) {
    res.clearCookie("accessToken");
    res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
  }
};
