import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as AccountModel from "../../models/account.model";
import * as RoleModel from "../../models/role.model";
import { DecodedToken } from "../../types";

export const check = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      res.json({ code: "error", message: "Token không hợp lệ" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const { id, email } = decoded;
    const existedEmail = await AccountModel.findEmail(email);

    if (!existedEmail) {
      res.json({ code: "error", message: "Token không hợp lệ" });
      return;
    }

    if (existedEmail.user_status !== "active") {
      res.clearCookie("accessToken");
      res.json({ code: "ban", message: "Tài khoản không hoạt động" });
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

    res.json({
      code: "success",
      message: "Token hợp lệ",
      infoUser: infoUser,
    });
  } catch (error) {
    res.clearCookie("accessToken");
    res.json({ code: "error", message: "Token không hợp lệ" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie("accessToken");
  res.json({ code: "success", message: "Đăng xuất thành công" });
};
