import jwt from "jsonwebtoken";
import * as AccountModel from "../../models/account.model";
import * as RoleModel from "../../models/role.model";
import { DecodedToken } from "../../types";
import { redisClient } from "../../config/redis.config";

export class AuthControllerServiceError extends Error {
  status: number;
  data: Record<string, unknown> | null;
  clearAccessToken?: boolean;
  clearRefreshToken?: boolean;

  constructor(
    status: number,
    message: string,
    options?: {
      data?: Record<string, unknown> | null;
      clearAccessToken?: boolean;
      clearRefreshToken?: boolean;
    },
  ) {
    super(message);
    this.status = status;
    this.data = options?.data ?? null;
    this.clearAccessToken = options?.clearAccessToken;
    this.clearRefreshToken = options?.clearRefreshToken;
  }
}

export const check = async (
  token?: string,
): Promise<Record<string, unknown>> => {
  if (!token) {
    throw new AuthControllerServiceError(401, "Token không hợp lệ");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const { email } = decoded;
    const existedEmail = await AccountModel.findUserByEmail(email);

    if (!existedEmail) {
      throw new AuthControllerServiceError(401, "Token không hợp lệ", {
        clearAccessToken: true,
      });
    }

    if (existedEmail.user_status !== "active") {
      throw new AuthControllerServiceError(403, "Tài khoản không hoạt động", {
        data: { banned: true },
        clearAccessToken: true,
        clearRefreshToken: true,
      });
    }

    const detailedRole = await RoleModel.findById(existedEmail.role_id);
    return {
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
  } catch (error) {
    if (error instanceof AuthControllerServiceError) {
      throw error;
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthControllerServiceError(401, "Token đã hết hạn", {
        data: { tokenExpired: true },
      });
    }

    throw new AuthControllerServiceError(401, "Token không hợp lệ", {
      clearAccessToken: true,
    });
  }
};

export const logout = async (token?: string): Promise<void> => {
  try {
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
        console.log("Token verification failed during logout:", error);
      }
    }
  } catch (error) {
    console.error("Logout error:", error);
  }
};
