import { Response } from "express";
import { AuthRequest } from "../../types";
import * as accountService from "../../services/client/account.service";
import { accessTokenTtl } from "../../config/variable.config";

function setOtpCookie(res: Response, challengeId: string): void {
  res.cookie("verified_otp_token", challengeId, {
    maxAge: 120 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
}

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie("accessToken", accessToken, {
    maxAge: accessTokenTtl * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.cookie("refreshToken", refreshToken, {
    maxAge: 604800 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
}

function setAccessTokenCookie(res: Response, accessToken: string): void {
  res.cookie("accessToken", accessToken, {
    maxAge: accessTokenTtl * 1000,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
}

function handleServiceError(
  error: unknown,
  res: Response,
  fallbackMessage: string,
): void {
  if (error instanceof accountService.AccountServiceError) {
    if (error.clearOtpCookie) {
      res.clearCookie("verified_otp_token");
    }
    if (error.clearAuthCookies) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
    }

    res.status(error.status).json({
      success: false,
      message: error.message,
      data: error.data,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: fallbackMessage,
    data: null,
  });
}

export const register = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const email = req.body.email;
    const full_name = req.body.full_name;
    const password = req.body.password;

    const result = await accountService.register({
      email,
      full_name,
      password,
    });

    if (result.otpAlreadySent) {
      res.status(200).json({
        success: true,
        message: "OTP đã được gửi và có hạn trong vòng 2 phút!",
        data: { otpAlreadySent: true },
      });
      return;
    }

    if (result.challengeId) {
      setOtpCookie(res, result.challengeId);
    }

    res.status(200).json({
      success: true,
      message: "Vui lòng nhập mã OTP",
      data: null,
    });
  } catch (error) {
    handleServiceError(error, res, "Có lỗi xảy ra, vui lòng thử lại!");
  }
};

export const googleLogin = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const credential = req.body.credential;
    if (!credential) {
      res.status(400).json({
        success: false,
        message: "Đăng nhập bằng Google thất bại",
        data: null,
      });
      return;
    }

    const result = await accountService.googleLogin({ credential });

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      message: "Đăng nhập Google thành công",
      data: result.user,
    });
  } catch (error) {
    handleServiceError(error, res, "Đăng nhập bằng Google thất bại");
  }
};

export const registerVerify = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const otp = req.body?.otp;

    await accountService.registerVerify({
      otp,
      challengeId: req.registerChallengeId,
      challengeKey: req.registerChallengeKey,
      registerData: req.registerData,
    });

    res.clearCookie("verified_otp_token");
    res.status(200).json({
      success: true,
      message: "Chúc mừng bạn đã đăng ký thành công",
      data: null,
    });
  } catch (error) {
    if (!(error instanceof accountService.AccountServiceError)) {
      res.clearCookie("verified_otp_token");
    }
    handleServiceError(error, res, "Có lỗi xảy ra ở đây");
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const result = await accountService.login({ email, password });

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      success: true,
      message: "Chúc mừng bạn đã đến website của chúng tôi!",
      data: result.user,
    });
  } catch (error) {
    handleServiceError(error, res, "Có lỗi xảy ra, vui lòng thử lại!");
  }
};

export const forgotPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const email = req.body.email;
    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email không tồn tại trong hệ thống",
        data: null,
      });
      return;
    }

    const result = await accountService.forgotPassword({ email });

    if (result.otpAlreadySent) {
      res.status(200).json({
        success: true,
        message: "OTP đã được gửi và có hạn trong vòng 2 phút!",
        data: { otpAlreadySent: true },
      });
      return;
    }

    if (result.challengeId) {
      setOtpCookie(res, result.challengeId);
    }

    res.status(200).json({
      success: true,
      message: "Vui lòng nhập mã OTP",
      data: null,
    });
  } catch (error) {
    handleServiceError(error, res, "Có lỗi xảy ra, vui lòng thử lại!");
  }
};

export const forgotPasswordVerify = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const otp = req.body?.otp;

    await accountService.forgotPasswordVerify({
      otp,
      challengeKey: req.forgotPasswordChallengeKey,
      forgotPasswordData: req.forgotPasswordData,
    });

    res.status(200).json({
      success: true,
      message: "Vui lòng nhập lại mật khẩu",
      data: null,
    });
  } catch (error) {
    if (!(error instanceof accountService.AccountServiceError)) {
      res.clearCookie("verified_otp_token");
    }
    handleServiceError(error, res, "Có lỗi xảy ra ở đây");
  }
};

export const resetPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const password = req.body?.password;
    if (!password) {
      res.status(400).json({
        success: false,
        message: "Vui lòng nhập mật khẩu mới!",
        data: null,
      });
      return;
    }

    await accountService.resetPassword({
      password,
      challengeKey: req.forgotPasswordChallengeKey,
      forgotPasswordData: req.forgotPasswordData,
    });

    res.clearCookie("verified_otp_token");
    res.status(200).json({
      success: true,
      message: "Đã đặt lại mật khẩu thành công",
      data: null,
    });
  } catch (error) {
    if (!(error instanceof accountService.AccountServiceError)) {
      res.clearCookie("verified_otp_token");
    }
    handleServiceError(error, res, "Có lỗi xảy ra ở đây");
  }
};

export const refreshToken = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    const result = await accountService.refreshToken({ refreshToken });

    setAccessTokenCookie(res, result.accessToken);

    res.status(200).json({
      success: true,
      message: "Đã làm mới access token thành công",
      data: result.user,
    });
  } catch (error) {
    handleServiceError(error, res, "Có lỗi xảy ra khi làm mới token");
  }
};
