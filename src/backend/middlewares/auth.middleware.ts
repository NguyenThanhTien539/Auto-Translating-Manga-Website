import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import * as VerifyModel from "../models/verify.model";
import * as accountModel from "../models/account.model";
import * as RoleModel from "../models/role.model";
import { AuthRequest, DecodedToken, RegisterInfo } from "../types";

export const verifyOTPToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let email: string | undefined;
  try {
    const verified_otp_token = req.cookies.verified_otp_token;
    const decodedData = jwt.verify(
      verified_otp_token,
      process.env.JWT_SECRET!,
    ) as DecodedToken & RegisterInfo;
    email = decodedData.email;
    await VerifyModel.deleteExpiredOTP();
    const existedRecord = await VerifyModel.findEmailAndOtp(
      decodedData.email,
      decodedData.otp!,
    );

    if (!existedRecord) {
      res.clearCookie("verified_otp_token");
      res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
    }

    if (decodedData.email && decodedData.password && decodedData.fullName) {
      (req as any).infoUser = {
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

export const adminAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authToken = req.cookies.accessToken;
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
      res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
    }

    const detailedRole = await RoleModel.findById(decodedData.role);
    if (detailedRole?.role_code !== "ADM") {
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

export const clientAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authToken = req.cookies.accessToken;
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
      res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
    }

    req.infoUser = existedRecord;
    next();
  } catch (error) {
    res.clearCookie("accessToken");
    res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
  }
};

export const uploaderAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authToken = req.cookies.accessToken;
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
      res.json({ code: "error", message: "Có lỗi xảy ra ở đây" });
      return;
    }

    if (existedRecord.user_status !== "active") {
      res.clearCookie("accessToken");
      res.json({ code: "error", message: "Tài khoản không hoạt động" });
      return;
    }

    const detailedRole = await RoleModel.findById(decodedData.role);
    if (detailedRole?.role_code !== "UPL") {
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
