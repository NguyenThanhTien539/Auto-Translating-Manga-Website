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
  accessTokenTtl,
  refreshTokenTtl,
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

function generateAccessToken(finalData: TokenData): string {
  return jwt.sign(finalData, process.env.JWT_SECRET!, {
    expiresIn: accessTokenTtl, // 15 minutes
  });
}

function generateRefreshToken(finalData: TokenData): string {
  return jwt.sign(finalData, process.env.JWT_SECRET!, {
    expiresIn: refreshTokenTtl, // 7 days
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
    res.status(400).json({
      success: false,
      message: "Email đã tồn tại trong hệ thống!",
      data: null,
    });
    return;
  }

  // Kiểm tra email này đang có OTP/challenge còn sống không
  const emailKey = `register:email:${email}`;
  const existedChallengeId = await redisClient.get(emailKey);

  if (existedChallengeId) {
    res.status(200).json({
      success: true,
      message: "OTP đã được gửi và có hạn trong vòng 2 phút!",
      data: { otpAlreadySent: true },
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

    res.status(200).json({
      success: true,
      message: "Vui lòng nhập mã OTP",
      data: null,
    });
  } catch (error) {
    await redisClient.del(challengeKey);
    await redisClient.del(emailKey);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra, vui lòng thử lại!",
      data: null,
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
          success: false,
          message:
            "Email này đã được đăng ký bằng tài khoản thường, không thể đăng nhập bằng Google",
          data: null,
        });
        return;
      }
    }

    const tokenPayload = {
      id: account.user_id,
      role: account.role_id,
      email: account.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in Redis
    const refreshTokenKey = `refresh_token:${account.user_id}`;
    await redisClient.set(refreshTokenKey, refreshToken, {
      EX: refreshTokenTtl,
    });

    // Set access token cookie
    res.cookie("accessToken", accessToken, {
      maxAge: accessTokenTtl * 1000,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      maxAge: refreshTokenTtl * 1000,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.status(200).json({
      success: true,
      message: "Đăng nhập Google thành công",
      data: {
        userId: account.user_id,
        email: account.email,
        role: account.role_id,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Đăng nhập bằng Google thất bại",
      data: null,
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
      res.status(400).json({
        success: false,
        message: "Phiên xác thực không hợp lệ hoặc đã hết hạn!",
        data: null,
      });
      return;
    }

    if (!inputOtp) {
      res.status(400).json({
        success: false,
        message: "Vui lòng nhập mã OTP!",
        data: { otpError: true },
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

        res.status(400).json({
          success: false,
          message: "Bạn đã nhập sai OTP quá số lần cho phép!",
          data: { otpError: true },
        });
        return;
      }

      const ttl = await redisClient.ttl(challengeKey);
      if ((ttl as number) > 0) {
        await redisClient.set(challengeKey, JSON.stringify(registerData), {
          EX: Number(ttl),
        });
      }

      res.status(400).json({
        success: false,
        message: "OTP không hợp lệ!",
        data: { otpError: true },
      });
      return;
    }

    const existedEmail = await AccountModel.findUserByEmail(registerData.email);
    if (existedEmail) {
      await redisClient.del(challengeKey);
      await redisClient.del(`register:email:${registerData.email}`);
      res.clearCookie("verified_otp_token");

      res.status(400).json({
        success: false,
        message: "Email đã tồn tại trong hệ thống!",
        data: null,
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
    res.status(200).json({
      success: true,
      message: "Chúc mừng bạn đã đăng ký thành công",
      data: null,
    });
  } catch (error) {
    console.error("registerVerify error:", error);
    res.clearCookie("verified_otp_token");
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở đây",
      data: null,
    });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const existedAccount = await AccountModel.findUserByEmail(req.body.email);
  if (!existedAccount) {
    res.status(400).json({
      success: false,
      message: "Email chưa tồn tại trong hệ thống",
      data: null,
    });
    return;
  }

  const isPasswordValidate = await comparePassword(
    req.body.password,
    existedAccount.password,
  );

  if (!isPasswordValidate) {
    res.status(400).json({
      success: false,
      message: "Mật khẩu không đúng",
      data: null,
    });
    return;
  }
  if (existedAccount.user_status == "ban") {
    res.status(400).json({
      success: false,
      message: "Tài khoản của bạn đã bị khóa.",
      data: null,
    });
    return;
  }

  const tokenPayload = {
    id: existedAccount.user_id,
    role: existedAccount.role_id,
    email: existedAccount.email,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token in Redis with user ID as key
  const refreshTokenKey = `refresh_token:${existedAccount.user_id}`;
  await redisClient.set(refreshTokenKey, refreshToken, {
    EX: refreshTokenTtl, // 7 days
  });

  // Set access token cookie (15 minutes)
  res.cookie("accessToken", accessToken, {
    maxAge: accessTokenTtl * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  // Set refresh token cookie (7 days)
  res.cookie("refreshToken", refreshToken, {
    maxAge: refreshTokenTtl * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.status(200).json({
    success: true,
    message: "Chúc mừng bạn đã đến website của chúng tôi!",
    data: {
      userId: existedAccount.user_id,
      email: existedAccount.email,
      role: existedAccount.role_id,
    },
  });
};

export const forgotPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { email } = req.body;

  const existedEmail = await AccountModel.findUserByEmail(email);
  if (!existedEmail) {
    res.status(400).json({
      success: false,
      message: "Email không tồn tại trong hệ thống",
      data: null,
    });
    return;
  }

  const emailKey = `forgot-password:email:${email}`;
  const existedChallengeId = await redisClient.get(emailKey);

  if (existedChallengeId) {
    res.status(200).json({
      success: true,
      message: "OTP đã được gửi và có hạn trong vòng 2 phút!",
      data: { otpAlreadySent: true },
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

    res.status(200).json({
      success: true,
      message: "Vui lòng nhập mã OTP",
      data: null,
    });
  } catch (error) {
    await redisClient.del(challengeKey);
    await redisClient.del(emailKey);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra, vui lòng thử lại!",
      data: null,
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
      res.status(400).json({
        success: false,
        message: "Phiên xác thực không hợp lệ hoặc đã hết hạn!",
        data: null,
      });
      return;
    }

    if (!inputOtp) {
      res.status(400).json({
        success: false,
        message: "Vui lòng nhập mã OTP!",
        data: { otpError: true },
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

        res.status(400).json({
          success: false,
          message: "Bạn đã nhập sai OTP quá số lần cho phép!",
          data: { otpError: true },
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

      console.log("forgotPasswordVerify OTP không hợp lệ:", inputOtp);
      res.status(400).json({
        success: false,
        message: "OTP không hợp lệ!",
        data: { otpError: true },
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

    res.status(200).json({
      success: true,
      message: "Vui lòng nhập lại mật khẩu",
      data: null,
    });
  } catch (error) {
    console.error("forgotPasswordVerify error:", error);
    res.clearCookie("verified_otp_token");
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở đây",
      data: null,
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
      res.status(400).json({
        success: false,
        message: "Phiên xác thực không hợp lệ hoặc đã hết hạn!",
        data: null,
      });
      return;
    }

    if (!forgotPasswordData.isOtpVerified) {
      res.status(400).json({
        success: false,
        message: "Vui lòng xác thực OTP trước khi đổi mật khẩu!",
        data: null,
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
    res.status(200).json({
      success: true,
      message: "Đã đặt lại mật khẩu thành công",
      data: null,
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.clearCookie("verified_otp_token");
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở đây",
      data: null,
    });
  }
};

export const refreshToken = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: "Refresh token không tồn tại",
        data: null,
      });
      return;
    }

    // Verify the refresh token
    let decodedToken: TokenData;
    try {
      decodedToken = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET!,
      ) as TokenData;
    } catch (error) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.status(401).json({
        success: false,
        message: "Refresh token không hợp lệ hoặc đã hết hạn",
        data: null,
      });
      return;
    }

    // Check if refresh token exists in Redis
    const refreshTokenKey = `refresh_token:${decodedToken.id}`;
    const storedToken = await redisClient.get(refreshTokenKey);

    if (!storedToken || storedToken !== refreshToken) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.status(401).json({
        success: false,
        message: "Refresh token không hợp lệ",
        data: null,
      });
      return;
    }

    // Verify user still exists and is active
    const existedAccount = await AccountModel.findUserByEmail(decodedToken.email);
    if (!existedAccount || existedAccount.user_status == "ban") {
      await redisClient.del(refreshTokenKey);
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại hoặc đã bị khóa",
        data: null,
      });
      return;
    }

    // Generate new access token
    const tokenPayload = {
      id: decodedToken.id,
      role: decodedToken.role,
      email: decodedToken.email,
    };
    const newAccessToken = generateAccessToken(tokenPayload);

    // Set new access token cookie
    res.cookie("accessToken", newAccessToken, {
      maxAge: accessTokenTtl * 1000,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.status(200).json({
      success: true,
      message: "Đã làm mới access token thành công",
      data: {
        userId: decodedToken.id,
        email: decodedToken.email,
        role: decodedToken.role,
      },
    });
  } catch (error) {
    console.error("refreshToken error:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi làm mới token",
      data: null,
    });
  }
};
