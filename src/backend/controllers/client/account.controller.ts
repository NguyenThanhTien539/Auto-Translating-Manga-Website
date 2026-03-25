import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as AccountModel from "../../models/account.model";
import * as generateHelper from "../../helper/generate.helper";
import * as mailHelper from "../../helper/mail.helper";
import * as emailTemplate from "../../helper/email-template.helper";
import { AuthRequest } from "../../types";
import { jwtDecode } from "jwt-decode";
import { redisClient } from "../../config/redis.config";
import {
  ttlSeconds,
  accessTokenTtlRememberMe,
  accessTokenTtlDefault,
  saltRounds,
  Provider,
} from "../../config/variable.config";

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(saltRounds);
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
  const { email, full_name, password } = req.body;

  const existedEmail = await AccountModel.findUserByEmail(email);
  if (existedEmail) {
    res.json({
      code: "error",
      message: "Email đã tồn tại trong hệ thống!",
    });
    return;
  }

  // Kiểm tra email này đang có OTP/challenge còn sống không
  const emailKey = `register:email:${email}`;
  const existedChallengeId = await redisClient.get(emailKey);

  if (existedChallengeId) {
    res.json({
      code: "existedOTP",
      message: "OTP đã được gửi và có hạn trong vòng 2 phút!",
    });
    return;
  }

  const otp = generateHelper.generateOTP(6);
  const challengeId = crypto.randomUUID();

  // Hash password và OTP trước khi lưu Redis
  const passwordHash = await bcrypt.hash(password, 10);
  const otpHash = await bcrypt.hash(otp, 10);

  const challengeKey = `register:challenge:${challengeId}`;

  const registerData = {
    email,
    full_name,
    passwordHash,
    otpHash,
    attemptCount: 0,
    resendCount: 0,
    createdAt: Date.now(),
  };

  try {
    await redisClient
      .multi()
      .set(challengeKey, JSON.stringify(registerData), { EX: ttlSeconds })
      .set(emailKey, challengeId, { EX: ttlSeconds })
      .exec();

    const title = "Mã OTP xác nhận đăng ký";
    const content = emailTemplate.getOTPTemplate(
      otp,
      "xác nhận đăng ký tài khoản",
    );

    await mailHelper.sendMail(email, title, content);

    res.cookie("verified_otp_token", challengeId, {
      maxAge: ttlSeconds * 1000,
      httpOnly: true,
      secure: false, // production nên là true nếu dùng HTTPS
      sameSite: "lax",
    });

    res.json({
      code: "success",
      message: "Vui lòng nhập mã OTP",
    });
  } catch (error) {
    await redisClient.del(challengeKey);
    await redisClient.del(emailKey);
    res.status(500).json({
      code: "error",
      message: "Có lỗi xảy ra, vui lòng thử lại!",
    });
  }
};

export const googleLogin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const decoded = jwtDecode(req.body.credential);
    const { email, name, sub } = decoded as any;

    let account = await AccountModel.findUserByEmail(email);

    if (!account) {
      const countAccounts = (await AccountModel.countAccounts()) + 1;
      const username = cleanVietnameseName(name) + `@${countAccounts}`;

      const userData = {
        email,
        full_name: name,
        password: null,
        username,
      };

      const providerData = {
        provider: Provider.GOOGLE,
        provider_id: String(sub),
      };

      account = await AccountModel.createAccount(userData, providerData);
    } else {
      const googleProvider = await AccountModel.findUserProvider(
        account.user_id,
        Provider.GOOGLE,
      );

      if (!googleProvider) {
        res.status(400).json({
          code: "error",
          message:
            "Email này đã được đăng ký bằng tài khoản thường, không thể đăng nhập bằng Google",
        });
        return;
      }
    }

    const accessToken = generateAccessToken(
      {
        id: account.user_id,
        role: account.role_id,
        email: account.email,
      },
      true,
    );

    res.cookie("accessToken", accessToken, {
      maxAge: accessTokenTtlRememberMe,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json({
      code: "success",
      message: "Đăng nhập Google thành công",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Đăng nhập bằng Google thất bại",
    });
  }
};

export const registerVerify = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const inputOtp = req.body.otp;
    const challengeId = req.registerChallengeId;
    const challengeKey = req.registerChallengeKey;
    const registerData = req.registerData;

    if (!challengeId || !challengeKey || !registerData) {
      res.clearCookie("verified_otp_token");
      res.json({
        code: "error",
        message: "Phiên xác thực không hợp lệ hoặc đã hết hạn!",
      });
      return;
    }

    if (!inputOtp) {
      res.json({
        code: "otpError",
        message: "Vui lòng nhập mã OTP!",
      });
      return;
    }

    const isMatch = await bcrypt.compare(inputOtp, registerData.otpHash);

    if (!isMatch) {
      registerData.attemptCount += 1;

      const maxAttempts = 5;
      if (registerData.attemptCount >= maxAttempts) {
        await redisClient.del(challengeKey);
        await redisClient.del(`register:email:${registerData.email}`);
        res.clearCookie("verified_otp_token");

        res.json({
          code: "otpError",
          message: "Bạn đã nhập sai OTP quá số lần cho phép!",
        });
        return;
      }

      const ttl = await redisClient.ttl(challengeKey);
      if ((ttl as number) > 0) {
        await redisClient.set(challengeKey, JSON.stringify(registerData), {
          EX: Number(ttl),
        });
      }

      res.json({
        code: "otpError",
        message: "OTP không hợp lệ!",
      });
      return;
    }

    const existedEmail = await AccountModel.findUserByEmail(registerData.email);
    if (existedEmail) {
      await redisClient.del(challengeKey);
      await redisClient.del(`register:email:${registerData.email}`);
      res.clearCookie("verified_otp_token");

      res.json({
        code: "error",
        message: "Email đã tồn tại trong hệ thống!",
      });
      return;
    }

    const countAccounts = (await AccountModel.countAccounts()) + 1;
    const username =
      cleanVietnameseName(registerData.full_name) + `@${countAccounts}`;

    const userData = {
      email: registerData.email,
      full_name: registerData.full_name,
      password: registerData.passwordHash,
      username,
    };

    const providerData = {
      provider: Provider.LOCAL,
      provider_id: null,
    };
    await AccountModel.createAccount(userData, providerData);

    await redisClient.del(challengeKey);
    await redisClient.del(`register:email:${registerData.email}`);

    const welcomeTitle = "Chào mừng đến với Manga Website";
    const welcomeContent = emailTemplate.getWelcomeTemplate(
      registerData.full_name,
    );
    await mailHelper.sendMail(registerData.email, welcomeTitle, welcomeContent);

    res.clearCookie("verified_otp_token");
    res.json({
      code: "success",
      message: "Chúc mừng bạn đã đăng ký thành công",
    });
  } catch (error) {
    console.error("registerVerify error:", error);
    res.clearCookie("verified_otp_token");
    res.json({
      code: "error",
      message: "Có lỗi xảy ra ở đây",
    });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const existedAccount = await AccountModel.findUserByEmail(req.body.email);
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
    maxAge: req.body.rememberMe
      ? accessTokenTtlRememberMe
      : accessTokenTtlDefault,
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
  const { email } = req.body;

  const existedEmail = await AccountModel.findUserByEmail(email);
  if (!existedEmail) {
    res.json({ code: "error", message: "Email không tồn tại trong hệ thống" });
    return;
  }

  const emailKey = `forgot-password:email:${email}`;
  const existedChallengeId = await redisClient.get(emailKey);

  if (existedChallengeId) {
    res.json({
      code: "existedOTP",
      message: "OTP đã được gửi và có hạn trong vòng 2 phút!",
    });
    return;
  }

  const otp = generateHelper.generateOTP(6);
  const challengeId = crypto.randomUUID();
  const otpHash = await bcrypt.hash(otp, 10);

  const challengeKey = `forgot-password:challenge:${challengeId}`;

  const forgotPasswordData = {
    email,
    otpHash,
    attemptCount: 0,
    resendCount: 0,
    isOtpVerified: false,
    createdAt: Date.now(),
  };

  try {
    await redisClient
      .multi()
      .set(challengeKey, JSON.stringify(forgotPasswordData), { EX: ttlSeconds })
      .set(emailKey, challengeId, { EX: ttlSeconds })
      .exec();

    const title = "Mã OTP để lấy lại mật khẩu";
    const content = emailTemplate.getOTPTemplate(otp, "lấy lại mật khẩu");
    await mailHelper.sendMail(email, title, content);

    res.cookie("verified_otp_token", challengeId, {
      maxAge: ttlSeconds * 1000,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json({
      code: "success",
      message: "Vui lòng nhập mã OTP",
    });
  } catch (error) {
    await redisClient.del(challengeKey);
    await redisClient.del(emailKey);
    res.status(500).json({
      code: "error",
      message: "Có lỗi xảy ra, vui lòng thử lại!",
    });
  }
};

export const forgotPasswordVerify = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const inputOtp = req.body.otp;
    const challengeKey = req.forgotPasswordChallengeKey;
    const forgotPasswordData = req.forgotPasswordData;

    if (!challengeKey || !forgotPasswordData) {
      res.clearCookie("verified_otp_token");
      res.json({
        code: "error",
        message: "Phiên xác thực không hợp lệ hoặc đã hết hạn!",
      });
      return;
    }

    if (!inputOtp) {
      res.json({
        code: "otpError",
        message: "Vui lòng nhập mã OTP!",
      });
      return;
    }

    const isMatch = await bcrypt.compare(inputOtp, forgotPasswordData.otpHash);

    if (!isMatch) {
      forgotPasswordData.attemptCount += 1;

      const maxAttempts = 5;
      if (forgotPasswordData.attemptCount >= maxAttempts) {
        await redisClient.del(challengeKey);
        await redisClient.del(
          `forgot-password:email:${forgotPasswordData.email}`,
        );
        res.clearCookie("verified_otp_token");

        res.json({
          code: "otpError",
          message: "Bạn đã nhập sai OTP quá số lần cho phép!",
        });
        return;
      }

      const ttl = await redisClient.ttl(challengeKey);
      if ((ttl as number) > 0) {
        await redisClient.set(
          challengeKey,
          JSON.stringify(forgotPasswordData),
          {
            EX: Number(ttl),
          },
        );
      }

      res.json({
        code: "otpError",
        message: "OTP không hợp lệ!",
      });
      return;
    }

    forgotPasswordData.isOtpVerified = true;
    const ttl = await redisClient.ttl(challengeKey);
    if ((ttl as number) > 0) {
      await redisClient.set(challengeKey, JSON.stringify(forgotPasswordData), {
        EX: Number(ttl),
      });
    }

    res.json({
      code: "success",
      message: "Vui lòng nhập lại mật khẩu",
    });
  } catch (error) {
    console.error("forgotPasswordVerify error:", error);
    res.clearCookie("verified_otp_token");
    res.json({
      code: "error",
      message: "Có lỗi xảy ra ở đây",
    });
  }
};

export const resetPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { password } = req.body;
    const challengeKey = req.forgotPasswordChallengeKey;
    const forgotPasswordData = req.forgotPasswordData;

    if (!challengeKey || !forgotPasswordData) {
      res.clearCookie("verified_otp_token");
      res.json({
        code: "error",
        message: "Phiên xác thực không hợp lệ hoặc đã hết hạn!",
      });
      return;
    }

    if (!forgotPasswordData.isOtpVerified) {
      res.json({
        code: "error",
        message: "Vui lòng xác thực OTP trước khi đổi mật khẩu!",
      });
      return;
    }

    const newPassword = await hashPassword(password);
    await AccountModel.updatePassword(forgotPasswordData.email, newPassword);

    await redisClient.del(challengeKey);
    await redisClient.del(`forgot-password:email:${forgotPasswordData.email}`);

    const resetSuccessTitle = "Đổi mật khẩu thành công";
    const resetSuccessContent = emailTemplate.getPasswordResetSuccessTemplate();
    await mailHelper.sendMail(
      forgotPasswordData.email,
      resetSuccessTitle,
      resetSuccessContent,
    );

    res.clearCookie("verified_otp_token");
    res.json({
      code: "success",
      message: "Đã đặt lại mật khẩu thành công",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.clearCookie("verified_otp_token");
    res.json({
      code: "error",
      message: "Có lỗi xảy ra ở đây",
    });
  }
};
