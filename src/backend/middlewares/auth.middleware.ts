import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import * as accountModel from "../models/account.model";
import * as RoleModel from "../models/role.model";
import { AuthRequest, DecodedToken } from "../types";
import { redisClient } from "../config/redis.config";

export const verifyRegisterChallenge = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const challengeId = req.cookies?.verified_otp_token;

    if (!challengeId) {
      res.clearCookie("verified_otp_token");
      res.json({
        code: "error",
        message: "Phiên xác thực không hợp lệ hoặc đã hết hạn!",
      });
      return;
    }

    const challengeKey = `register:challenge:${challengeId}`;
    const rawData = await redisClient.get(challengeKey);

    if (!rawData) {
      res.clearCookie("verified_otp_token");
      res.json({
        code: "error",
        message: "Mã OTP đã hết hạn hoặc không tồn tại!",
      });
      return;
    }

    const rawDataText =
      typeof rawData === "string" ? rawData : rawData.toString("utf8");

    const registerData = JSON.parse(rawDataText) as {
      email: string;
      full_name: string;
      address?: string;
      passwordHash: string;
      otpHash: string;
      attemptCount: number;
      resendCount: number;
      createdAt: number;
    };

    req.registerChallengeId = challengeId;
    req.registerChallengeKey = challengeKey;
    req.registerData = registerData;

    next();
  } catch (error) {
    console.error("verifyRegisterChallenge error:", error);
    res.clearCookie("verified_otp_token");
    res.json({
      code: "error",
      message: "Có lỗi xảy ra ở đây",
    });
  }
};

export const verifyForgotPasswordChallenge = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const challengeId = req.cookies?.verified_otp_token;

    if (!challengeId) {
      res.clearCookie("verified_otp_token");
      res.json({
        code: "error",
        message: "Phiên xác thực không hợp lệ hoặc đã hết hạn!",
      });
      return;
    }

    const challengeKey = `forgot-password:challenge:${challengeId}`;
    const rawData = await redisClient.get(challengeKey);

    if (!rawData) {
      res.clearCookie("verified_otp_token");
      res.json({
        code: "error",
        message: "Mã OTP đã hết hạn hoặc không tồn tại!",
      });
      return;
    }

    const rawDataText =
      typeof rawData === "string" ? rawData : rawData.toString("utf8");

    const forgotPasswordData = JSON.parse(rawDataText) as {
      email: string;
      otpHash: string;
      attemptCount: number;
      resendCount: number;
      isOtpVerified: boolean;
      createdAt: number;
    };

    req.forgotPasswordChallengeId = challengeId;
    req.forgotPasswordChallengeKey = challengeKey;
    req.forgotPasswordData = forgotPasswordData;

    next();
  } catch (error) {
    console.error("verifyForgotPasswordChallenge error:", error);
    res.clearCookie("verified_otp_token");
    res.json({
      code: "error",
      message: "Có lỗi xảy ra ở đây",
    });
  }
};

export const adminAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authToken = req.cookies.accessToken;

    if (!authToken) {
      res.status(401).json({
        success: false,
        message: "Không có token xác thực",
        data: null,
      });
      return;
    }

    const decodedData = jwt.verify(
      authToken,
      process.env.JWT_SECRET!,
    ) as DecodedToken;
    const existedRecord = await accountModel.findAminAuthToken(
      decodedData.id,
      decodedData.email,
      decodedData.role,
    );

    if (!existedRecord) {
      res.clearCookie("accessToken");
      res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
        data: null,
      });
      return;
    }

    const detailedRole = await RoleModel.findById(decodedData.role);
    if (detailedRole?.role_code !== "ADM") {
      res.clearCookie("accessToken");
      res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
        data: null,
      });
      return;
    }

    req.infoStaff = existedRecord;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token đã hết hạn",
        data: { tokenExpired: true },
      });
      return;
    }
    res.clearCookie("accessToken");
    res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
      data: null,
    });
  }
};

export const clientAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authToken = req.cookies.accessToken;

    if (!authToken) {
      res.status(401).json({
        success: false,
        message: "Không có token xác thực",
        data: null,
      });
      return;
    }

    const decodedData = jwt.verify(
      authToken,
      process.env.JWT_SECRET!,
    ) as DecodedToken;
    const existedRecord = await accountModel.findAminAuthToken(
      decodedData.id,
      decodedData.email,
      decodedData.role,
    );

    if (!existedRecord) {
      res.clearCookie("accessToken");
      res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
        data: null,
      });
      return;
    }

    req.infoUser = existedRecord;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token đã hết hạn",
        data: { tokenExpired: true },
      });
      return;
    }
    res.clearCookie("accessToken");
    res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
      data: null,
    });
  }
};

export const uploaderAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authToken = req.cookies.accessToken;

    if (!authToken) {
      res.status(401).json({
        success: false,
        message: "Không có token xác thực",
        data: null,
      });
      return;
    }

    const decodedData = jwt.verify(
      authToken,
      process.env.JWT_SECRET!,
    ) as DecodedToken;
    const existedRecord = await accountModel.findAminAuthToken(
      decodedData.id,
      decodedData.email,
      decodedData.role,
    );

    if (!existedRecord) {
      res.clearCookie("accessToken");
      res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
        data: null,
      });
      return;
    }

    if (existedRecord.user_status !== "active") {
      res.clearCookie("accessToken");
      res.status(403).json({
        success: false,
        message: "Tài khoản không hoạt động",
        data: null,
      });
      return;
    }

    const detailedRole = await RoleModel.findById(decodedData.role);
    if (detailedRole?.role_code !== "UPL") {
      res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập",
        data: null,
      });
      return;
    }
    req.infoUser = existedRecord;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token đã hết hạn",
        data: { tokenExpired: true },
      });
      return;
    }
    res.clearCookie("accessToken");
    res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
      data: null,
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authToken = req.cookies.accessToken;

    if (!authToken) {
      return next();
    }

    const decodedData = jwt.verify(
      authToken,
      process.env.JWT_SECRET!,
    ) as DecodedToken;
    const existedRecord = await accountModel.findAminAuthToken(
      decodedData.id,
      decodedData.email,
      decodedData.role,
    );

    if (existedRecord) {
      req.infoUser = existedRecord;
    }

    next();
  } catch (error) {
    res.clearCookie("accessToken");
    next();
  }
};
