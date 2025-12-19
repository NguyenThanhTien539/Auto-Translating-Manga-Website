const jwt = require("jsonwebtoken");
const VerifyModel = require("../models/verify.model");
const accountModel = require("../models/account.model");
const RoleModel = require("../models/role.model");

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
    const existedRecord = await accountModel.findAminAuthToken(
      decodedData.id,
      decodedData.email,
      decodedData.role
    );

    if (!existedRecord) {
      res.clearCookie("accessToken");
      res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
    }

    const detailedRole = await RoleModel.findById(decodedData.role);
    if (detailedRole.role_code !== "ADM") {
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

module.exports.clientAuth = async (req, res, next) => {
  try {
    const authToken = req.cookies.accessToken;
    const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);
    const existedRecord = await accountModel.findAminAuthToken(
      decodedData.id,
      decodedData.email,
      decodedData.role
    );

    if (!existedRecord) {
      res.clearCookie("accessToken");
      res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
    }

    req.infoUser = existedRecord;
    next();
  } catch (error) {
    res.clearCookie("accessToken");
    res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
  }
};

module.exports.uploaderAuth = async (req, res, next) => {
  try {
    const authToken = req.cookies.accessToken;
    const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);
    const existedRecord = await accountModel.findAminAuthToken(
      decodedData.id,
      decodedData.email,
      decodedData.role
    );

    if (!existedRecord) {
      res.clearCookie("accessToken");
      res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
      return;
    }

    const detailedRole = await RoleModel.findById(decodedData.role);
    if (detailedRole.role_code !== "UPL") {
      res.json({ code: "error", message: "Bạn không có quyền truy cập" });
      return;
    }

    req.infoUser = existedRecord;

    next();
  } catch (error) {
    res.clearCookie("accessToken");
    res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
  }
};

// Optional authentication - không bắt buộc đăng nhập
// Nếu có token hợp lệ thì set req.infoUser, nếu không thì bỏ qua
module.exports.optionalAuth = async (req, res, next) => {
  try {
    const authToken = req.cookies.accessToken;

    // Nếu không có token, cho phép tiếp tục (guest user)
    if (!authToken) {
      return next();
    }

    const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);
    const existedRecord = await accountModel.findAminAuthToken(
      decodedData.id,
      decodedData.email,
      decodedData.role
    );

    // Nếu có token hợp lệ, set user info
    if (existedRecord) {
      req.infoUser = existedRecord;
    }

    next();
  } catch (error) {
    // Nếu token không hợp lệ, xóa cookie và cho phép tiếp tục như guest
    res.clearCookie("accessToken");
    next();
  }
};
