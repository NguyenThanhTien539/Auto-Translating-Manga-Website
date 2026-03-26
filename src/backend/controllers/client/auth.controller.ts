import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as AccountModel from "../../models/account.model";
import * as RoleModel from "../../models/role.model";
import { DecodedToken } from "../../types";
import { redisClient } from "../../config/redis.config";

export const check = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
        data: null,
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const { id, email } = decoded;
    const existedEmail = await AccountModel.findUserByEmail(email);

    if (!existedEmail) {
      res.clearCookie("accessToken");
      res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
        data: null,
      });
      return;
    }

    if (existedEmail.user_status !== "active") {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.status(403).json({
        success: false,
        message: "Tài khoản không hoạt động",
        data: { banned: true },
      });
      return;
    }

    const detailedRole = await RoleModel.findById(existedEmail.role_id);
    const infoUser = {
      id: existedEmail.user_id,
      fullName: existedEmail.full_name,
      email: existedEmail.email,
      username: existedEmail.username,
      role: detailedRole?.role_name,
      phone: existedEmail.phone,
      address: existedEmail.address,
      avatar: existedEmail.avatar,
      coin_balance: existedEmail.coin_balance,
    };

    res.status(200).json({
      success: true,
      message: "Token hợp lệ",
      data: { user: infoUser },
    });
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

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.accessToken;

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET!,
        ) as DecodedToken;
        // Delete refresh token from Redis
        const refreshTokenKey = `refresh_token:${decoded.id}`;
        await redisClient.del(refreshTokenKey);
      } catch (error) {
        // Token might be expired or invalid, but we still clear cookies
        console.log("Token verification failed during logout:", error);
      }
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
      data: null,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
      data: null,
    });
  }
};
