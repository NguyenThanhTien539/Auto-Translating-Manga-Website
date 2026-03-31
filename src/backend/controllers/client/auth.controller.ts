import { Request, Response } from "express";
import * as authControllerService from "../../services/client/auth.service";

export const check = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.accessToken;
    const user = await authControllerService.check(token);
    res.status(200).json({
      success: true,
      message: "Token hợp lệ",
      data: { user },
    });
  } catch (error) {
    if (error instanceof authControllerService.AuthControllerServiceError) {
      if (error.clearAccessToken) {
        res.clearCookie("accessToken");
      }
      if (error.clearRefreshToken) {
        res.clearCookie("refreshToken");
      }
      res.status(error.status).json({
        success: false,
        message: error.message,
        data: error.data,
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
    await authControllerService.logout(token);

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
