import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as AccountModel from "../../models/account.model";
import * as VerifyModel from "../../models/verify.model";
import * as generateHelper from "../../helper/generate.helper";
import * as mailHelper from "../../helper/mail.helper";
import * as emailTemplate from "../../helper/email-template.helper";
import { AuthRequest } from "../../types";

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

interface TokenData {
  id: number;
  role: number;
  email: string;
}

function generateAccessToken(
  finalData: TokenData,
  rememberMe: boolean = false,
): string {
  return jwt.sign(finalData, process.env.JWT_SECRET!, {
    expiresIn: rememberMe ? "3d" : "1d",
  });
}

function cleanVietnameseName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export const register = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
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
      otp: otp,
      email: req.body.email,
      fullName: req.body.fullName,
      address: req.body.address,
      password: req.body.password,
    },
    `${process.env.JWT_SECRET}`,
    {
      expiresIn: "1m",
    },
  );

  const title = "Mã OTP xác nhận đăng ký";
  const content = emailTemplate.getOTPTemplate(otp, "xác nhận đăng ký tài khoản");
  mailHelper.sendMail(req.body.email, title, content);

  res.cookie("verified_otp_token", verified_otp_token, {
    maxAge: 1 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.json({
    code: "success",
    message: "Vui lòng nhập mã OTP",
  });
};

export const registerVerify = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const infoUser = (req as any).infoUser;
    const existedRecord = await VerifyModel.findEmailAndOtp(
      infoUser.email,
      req.body.otp,
    );
    if (!existedRecord) {
      res.json({
        code: "otp error",
        message: "OTP không hợp lệ!",
      });
      return;
    }

    infoUser.password = await hashPassword(infoUser.password);
    const countAccounts = (await AccountModel.countAccounts()) + 1;
    const username =
      cleanVietnameseName(infoUser.fullName) + `@${countAccounts}`;

    const userData = {
      email: infoUser.email,
      full_name: infoUser.fullName,
      password: infoUser.password,
      username: username,
    };
    await AccountModel.insertAccount(userData);
    await VerifyModel.deleteOtpByEmail(infoUser.email);

    // Send welcome email
    const welcomeTitle = "Chào mừng đến với Manga Website";
    const welcomeContent = emailTemplate.getWelcomeTemplate(infoUser.fullName);
    mailHelper.sendMail(infoUser.email, welcomeTitle, welcomeContent);

    res.clearCookie("verified_otp_token");
    res.json({
      code: "success",
      message: "Chúc mừng bạn đã đăng ký thành công",
    });
  } catch (error) {
    const infoUser = (req as any).infoUser;
    res.clearCookie("verified_otp_token");
    if (infoUser?.email) {
      await VerifyModel.deleteOtpByEmail(infoUser.email);
    }
    res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const existedAccount = await AccountModel.findEmail(req.body.email);
  if (!existedAccount) {
    res.json({ code: "error", message: "Email chưa tồn tại trong hệ thống" });
    return;
  }

  const isPasswordValidate = await comparePassword(
    req.body.password,
    existedAccount.password,
  );

  if (!isPasswordValidate) {
    res.json({
      code: "error",
      message: "Mật khẩu không đúng",
    });
    return;
  }
  if (existedAccount.user_status == "ban") {
    res.json({
      code: "error",
      message: "Tài khoản của bạn đã bị khóa.",
    });
    return;
  }

  const accessToken = generateAccessToken(
    {
      id: existedAccount.user_id,
      role: existedAccount.role_id,
      email: existedAccount.email,
    },
    req.body.rememberMe,
  );

  res.cookie("accessToken", accessToken, {
    maxAge: req.body.rememberMe ? 3 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
  res.json({
    role: existedAccount.role_id,
    code: "success",
    message: "Chúc mừng bạn đã đến website của chúng tôi!",
  });
};

export const forgotPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
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
    },
  );

  const title = "Mã OTP để lấy lại mật khẩu";
  const content = emailTemplate.getOTPTemplate(otp, "lấy lại mật khẩu");
  mailHelper.sendMail(req.body.email, title, content);

  res.cookie("verified_otp_token", verified_otp_token, {
    maxAge: 1 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
  res.json({
    code: "success",
    message: "Vui lòng nhập mã OTP",
  });
};

export const forgotPasswordVerify = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const existedRecord = await VerifyModel.findEmailAndOtp(
    req.email!,
    req.body.otp,
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

export const resetPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { password } = req.body;
  const email = req.email!;
  const newPassword = await hashPassword(password);
  await AccountModel.updatePassword(email, newPassword);
  await VerifyModel.deleteOtpByEmail(email);

  // Send password reset success email
  const resetSuccessTitle = "Đổi mật khẩu thành công";
  const resetSuccessContent = emailTemplate.getPasswordResetSuccessTemplate();
  mailHelper.sendMail(email, resetSuccessTitle, resetSuccessContent);

  res.clearCookie("verified_otp_token");
  res.json({
    code: "success",
    message: "Đã đặt lại mật khẩu thành công",
  });
};
