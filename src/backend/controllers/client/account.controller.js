const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AccountModel = require("../../models/account.model");
const VerifyModel = require("../../models/verify.model");
const generateHelper = require("../../helper/generate.helper");
const mailHelper = require("../../helper/mail.helper");

// Hasing password function
const SALT_ROUNDS = 10;
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

//  JWT token generation functions
function generateAccessToken(finalData, rememberMe = "") {
  return jwt.sign(finalData, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? "3d" : "1d",
  });
}

module.exports.register = async (req, res) => {
  const existedEmail = await AccountModel.findEmail(req.body.email);
  if (existedEmail) {
    res.json({
      code: "error",
      message: "Email đã tồn tại trong hệ thống!",
    });
    return;
  }

  await VerifyModel.deleteExpiredOTP();
  const existedOTP = await VerifyModel.findEmail(req.body.email);

  if (existedOTP) {
    res.json({
      code: "existedOTP",
      message: "OTP đã được gửi và có hạn trong vòng 2 phút!",
    });
    return;
  }
  const length = 6;
  const otp = generateHelper.generateOTP(length);

  await VerifyModel.insertOtpAndEmail(req.body.email, otp);

  const verified_otp_token = jwt.sign(
    {
      email: req.body.email,
      fullName: req.body.fullName,
      address: req.body.address,
      password: req.body.password,
    },
    `${process.env.JWT_SECRET}`,
    {
      expiresIn: "1m",
    }
  );

  const title = "Mã OTP xác nhận đăng ký";
  const content = `Mã OTP của bạn là <b>${otp}</b>. Mã OTP có hiệu lực trong 5 phút, vui lòng không cung cấp cho bất kỳ ai`;
  mailHelper.sendMail(req.body.email, title, content);

  res.cookie("verified_otp_token", verified_otp_token, {
    maxAge: 1 * 60 * 1000,
    httpOnly: true,
    secure: false, //https sets true and http sets false
    sameSite: "lax", //allow send cookie between domains
  });

  res.json({
    code: "success",
    message: "Vui lòng nhập mã OTP",
  });
};

module.exports.registerVerify = async (req, res) => {
  const verified_otp_token = req.cookies.verified_otp_token;
  if (!verified_otp_token) {
    res.clearCookie("verified_otp_token");
    res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
    return;
  }
  let email;
  try {
    const decodedData = jwt.verify(verified_otp_token, process.env.JWT_SECRET);
    email = decodedData.email;
    const existedRecord = await VerifyModel.findEmailAndOtp(
      decodedData.email,
      req.body.otp
    );
    if (!existedRecord) {
      res.json({
        code: "otp error",
        message: "OTP không hợp lệ!",
      });
      return;
    }
    decodedData.password = await hashPassword(decodedData.password);

    const countAccounts = await AccountModel.countAccounts();
    const username = decodedData.fullName + `@${countAccounts + 1}`;
    const userData = {
      email: decodedData.email,
      full_name: decodedData.fullName,
      password: decodedData.password,
      username: username,
    };
    await AccountModel.insertAccount(userData);
    await VerifyModel.deleteOtpByEmail(decodedData.email);

    res.clearCookie("verified_otp_token");
    res.json({
      code: "success",
      message: "Chúc mừng bạn đã đăng ký thành công",
    });
  } catch (error) {
    res.clearCookie("verified_otp_token");
    await VerifyModel.deleteOtpByEmail(email);
    res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
  }
};

module.exports.login = async (req, res) => {
  const existedAccount = await AccountModel.findEmail(req.body.email);
  if (!existedAccount) {
    res.json({ code: "error", message: "Email chưa tồn tại trong hệ thống" });
    return;
  }

  const isPasswordValidate = await comparePassword(
    req.body.password,
    existedAccount.password
  );

  if (!isPasswordValidate) {
    res.json({
      code: "error",
      message: "Mật khẩu không đúng",
    });
    return;
  }

  const accessToken = generateAccessToken(
    { id: existedAccount.id_user, role: existedAccount.role },
    req.body.rememberMe
  );

  res.cookie("accessToken", accessToken, {
    maxAge: req.body.rememberMe ? 3 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, //3 days or 1 days
    httpOnly: true,
    secure: false, //https sets true and http sets false
    sameSite: "lax", //allow send cookie between domains
  });

  res.json({
    code: "success",
    message: "Chúc mừng bạn đã đến website của chúng tôi!",
  });
};

module.exports.forgotPassword = async (req, res) => {
  const existedEmail = await AccountModel.findEmail(req.body.email);
  if (!existedEmail) {
    res.json({ code: "error", message: "Email không tồn tại trong hệ thống" });
    return;
  }

  await VerifyModel.deleteExpiredOTP();
  const existedOTP = await VerifyModel.findEmail(req.body.email);

  if (existedOTP) {
    res.json({
      code: "existedOTP",
      message: "OTP đã được gửi và có hạn trong vòng 5 phút!",
    });
    return;
  }

  const length = 6;
  const otp = generateHelper.generateOTP(length);

  await VerifyModel.insertOtpAndEmail(req.body.email, otp);

  const verified_otp_token = jwt.sign(
    {
      otp: otp,
      email: req.body.email,
    },
    `${process.env.JWT_SECRET}`,
    {
      expiresIn: "1m",
    }
  );

  const title = "Mã OTP để lấy lại mật khẩu";
  const content = `Mã OTP của bạn là <b>${otp}</b>. Mã OTP có hiệu lực trong 5 phút, vui lòng không cung cấp cho bất kỳ ai`;
  mailHelper.sendMail(req.body.email, title, content);

  res.cookie("verified_otp_token", verified_otp_token, {
    maxAge: 1 * 60 * 1000,
    httpOnly: true,
    secure: false, //https sets true and http sets false
    sameSite: "lax", //allow send cookie between domains
  });
  res.json({
    code: "success",
    message: "Vui lòng nhập mã OTP",
  });
};

module.exports.forgotPasswordVerify = async (req, res) => {
  await VerifyModel.deleteExpiredOTP();
  const verified_otp_token = req.cookies.verified_otp_token;
  if (!verified_otp_token) {
    res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
    res.clearCookie("verified_otp_token");
    return;
  }
  const decoded = jwt.verify(verified_otp_token, process.env.JWT_SECRET);

  const existedRecord = await VerifyModel.findEmailAndOtp(
    `${decoded.email}`,
    req.body.otp
  );

  if (!existedRecord) {
    res.json({
      code: "otp error",
      message: "OTP không hợp lệ!",
    });
    return;
  }
  res.json({
    code: "success",
    message: "Vui lòng nhập lại mật khẩu",
  });
};

module.exports.resetPassword = async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;

  const newPassword = await hashPassword(password);
  await AccountModel.updatePassword(email, newPassword);
  await VerifyModel.deleteOtpByEmail(email);

  res.clearCookie("verified_otp_token");
  res.json({
    code: "success",
    message: "Đã đặt lại mật khẩu thành công",
  });
};
