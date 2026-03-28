import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as AccountModel from "../../models/account.model";
import * as generateHelper from "../../helper/generate.helper";
import * as emailTemplate from "../../helper/email-template.helper";
import { ForgotPasswordRedisData, RegisterRedisData } from "../../types";
import { jwtDecode } from "jwt-decode";
import { redisClient } from "../../config/redis.config";
import { enqueueSendMail } from "../../queues/mail.queue";
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

type Nullable<T> = T | null;

export class AccountServiceError extends Error {
  status: number;
  data: Nullable<Record<string, unknown>>;
  clearOtpCookie?: boolean;
  clearAuthCookies?: boolean;

  constructor(
    status: number,
    message: string,
    options?: {
      data?: Nullable<Record<string, unknown>>;
      clearOtpCookie?: boolean;
      clearAuthCookies?: boolean;
    },
  ) {
    super(message);
    this.status = status;
    this.data = options?.data ?? null;
    this.clearOtpCookie = options?.clearOtpCookie;
    this.clearAuthCookies = options?.clearAuthCookies;
  }
}

function generateAccessToken(finalData: TokenData): string {
  return jwt.sign(finalData, process.env.JWT_SECRET!, {
    expiresIn: accessTokenTtl,
  });
}

function generateRefreshToken(finalData: TokenData): string {
  return jwt.sign(finalData, process.env.JWT_SECRET!, {
    expiresIn: refreshTokenTtl,
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

function createTokenPayload(data: TokenData): TokenData {
  return {
    id: data.id,
    role: data.role,
    email: data.email,
  };
}

export async function register(input: {
  email: string;
  full_name: string;
  password: string;
}): Promise<{ otpAlreadySent: boolean; challengeId?: string }> {
  const { email, full_name, password } = input;

  const existedEmail = await AccountModel.findUserByEmail(email);
  if (existedEmail) {
    throw new AccountServiceError(400, "Email đã tồn tại trong hệ thống!");
  }

  const emailKey = `register:email:${email}`;
  const existedChallengeId = await redisClient.get(emailKey);

  if (existedChallengeId) {
    return { otpAlreadySent: true };
  }

  const otp = generateHelper.generateOTP(6);
  const challengeId = crypto.randomUUID();

  const passwordHash = await hashPassword(password);
  const otpHash = await hashPassword(otp);

  const challengeKey = `register:challenge:${challengeId}`;

  const registerData: RegisterRedisData = {
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
    await enqueueSendMail({ email, title, content });

    return {
      otpAlreadySent: false,
      challengeId,
    };
  } catch (error) {
    await redisClient.del(challengeKey);
    await redisClient.del(emailKey);
    throw new AccountServiceError(500, "Có lỗi xảy ra, vui lòng thử lại!");
  }
}

export async function googleLogin(input: { credential: string }): Promise<{
  accessToken: string;
  refreshToken: string;
  user: { userId: number; email: string; role: number };
}> {
  try {
    const decoded = jwtDecode(input.credential);
    const { email, name, sub } = decoded as any;

    if (!email || !name || !sub) {
      throw new AccountServiceError(400, "Đăng nhập bằng Google thất bại");
    }

    let account = await AccountModel.findUserByEmail(email);

    if (!account) {
      const countAccounts = (await AccountModel.countAccounts()) + 1;
      const username = cleanVietnameseName(name) + `@${countAccounts}`;

      const userData = {
        email,
        full_name: name,
        password: null as any,
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
        throw new AccountServiceError(
          400,
          "Email này đã được đăng ký bằng tài khoản thường, không thể đăng nhập bằng Google",
        );
      }
    }

    const tokenPayload = createTokenPayload({
      id: account.user_id,
      role: account.role_id,
      email: account.email,
    });

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const refreshTokenKey = `refresh_token:${account.user_id}`;
    await redisClient.set(refreshTokenKey, refreshToken, {
      EX: refreshTokenTtl,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        userId: account.user_id,
        email: account.email,
        role: account.role_id,
      },
    };
  } catch (error) {
    if (error instanceof AccountServiceError) {
      throw error;
    }
    throw new AccountServiceError(400, "Đăng nhập bằng Google thất bại");
  }
}

export async function registerVerify(input: {
  otp?: string;
  challengeId?: string;
  challengeKey?: string;
  registerData?: RegisterRedisData;
}): Promise<void> {
  const { otp, challengeId, challengeKey, registerData } = input;

  if (!challengeId || !challengeKey || !registerData) {
    throw new AccountServiceError(
      400,
      "Phiên xác thực không hợp lệ hoặc đã hết hạn!",
      { clearOtpCookie: true },
    );
  }

  if (!otp) {
    throw new AccountServiceError(400, "Vui lòng nhập mã OTP!", {
      data: { otpError: true },
    });
  }

  const isMatch = await comparePassword(otp, registerData.otpHash);

  if (!isMatch) {
    registerData.attemptCount += 1;

    const maxAttempts = 5;
    if (registerData.attemptCount >= maxAttempts) {
      await redisClient.del(challengeKey);
      await redisClient.del(`register:email:${registerData.email}`);

      throw new AccountServiceError(
        400,
        "Bạn đã nhập sai OTP quá số lần cho phép!",
        {
          data: { otpError: true },
          clearOtpCookie: true,
        },
      );
    }

    const ttl = await redisClient.ttl(challengeKey);
    if ((ttl as number) > 0) {
      await redisClient.set(challengeKey, JSON.stringify(registerData), {
        EX: Number(ttl),
      });
    }

    throw new AccountServiceError(400, "OTP không hợp lệ!", {
      data: { otpError: true },
    });
  }

  const existedEmail = await AccountModel.findUserByEmail(registerData.email);
  if (existedEmail) {
    await redisClient.del(challengeKey);
    await redisClient.del(`register:email:${registerData.email}`);

    throw new AccountServiceError(400, "Email đã tồn tại trong hệ thống!", {
      clearOtpCookie: true,
    });
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
    provider_id: null as any,
  };
  await AccountModel.createAccount(userData, providerData);

  await redisClient.del(challengeKey);
  await redisClient.del(`register:email:${registerData.email}`);

  const welcomeTitle = "Chào mừng đến với Manga Website";
  const welcomeContent = emailTemplate.getWelcomeTemplate(
    registerData.full_name,
  );

  try {
    await enqueueSendMail({
      email: registerData.email,
      title: welcomeTitle,
      content: welcomeContent,
    });
  } catch (queueError) {
    console.error("Failed to enqueue welcome email:", queueError);
  }
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  user: { userId: number; email: string; role: number };
}> {
  const existedAccount = await AccountModel.findUserByEmail(input.email);
  if (!existedAccount) {
    throw new AccountServiceError(400, "Email chưa tồn tại trong hệ thống");
  }

  if (existedAccount.password === null) {
    throw new AccountServiceError(
      400,
      "Tài khoản này không thể đăng nhập bằng mật khẩu, vui lòng thử đăng nhập bằng Google",
    );
  }

  const isPasswordValidate = await comparePassword(
    input.password,
    existedAccount.password,
  );

  if (!isPasswordValidate) {
    throw new AccountServiceError(400, "Mật khẩu không đúng");
  }
  if (existedAccount.user_status == "ban") {
    throw new AccountServiceError(400, "Tài khoản của bạn đã bị khóa.");
  }

  const tokenPayload = createTokenPayload({
    id: existedAccount.user_id,
    role: existedAccount.role_id,
    email: existedAccount.email,
  });

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  const refreshTokenKey = `refresh_token:${existedAccount.user_id}`;
  await redisClient.set(refreshTokenKey, refreshToken, {
    EX: refreshTokenTtl,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      userId: existedAccount.user_id,
      email: existedAccount.email,
      role: existedAccount.role_id,
    },
  };
}

export async function forgotPassword(input: {
  email: string;
}): Promise<{ otpAlreadySent: boolean; challengeId?: string }> {
  const email = input.email;

  const existedEmail = await AccountModel.findUserByEmail(email);
  if (!existedEmail) {
    throw new AccountServiceError(400, "Email không tồn tại trong hệ thống");
  }

  const emailKey = `forgot-password:email:${email}`;
  const existedChallengeId = await redisClient.get(emailKey);

  if (existedChallengeId) {
    return { otpAlreadySent: true };
  }

  const otp = generateHelper.generateOTP(6);
  const challengeId = crypto.randomUUID();
  const otpHash = await hashPassword(otp);

  const challengeKey = `forgot-password:challenge:${challengeId}`;

  const forgotPasswordData: ForgotPasswordRedisData = {
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
    await enqueueSendMail({ email, title, content });

    return {
      otpAlreadySent: false,
      challengeId,
    };
  } catch (error) {
    await redisClient.del(challengeKey);
    await redisClient.del(emailKey);
    throw new AccountServiceError(500, "Có lỗi xảy ra, vui lòng thử lại!");
  }
}

export async function forgotPasswordVerify(input: {
  otp?: string;
  challengeKey?: string;
  forgotPasswordData?: ForgotPasswordRedisData;
}): Promise<void> {
  const { otp, challengeKey, forgotPasswordData } = input;

  if (!challengeKey || !forgotPasswordData) {
    throw new AccountServiceError(
      400,
      "Phiên xác thực không hợp lệ hoặc đã hết hạn!",
      { clearOtpCookie: true },
    );
  }

  if (!otp) {
    throw new AccountServiceError(400, "Vui lòng nhập mã OTP!", {
      data: { otpError: true },
    });
  }

  const isMatch = await comparePassword(otp, forgotPasswordData.otpHash);

  if (!isMatch) {
    forgotPasswordData.attemptCount += 1;

    const maxAttempts = 5;
    if (forgotPasswordData.attemptCount >= maxAttempts) {
      await redisClient.del(challengeKey);
      await redisClient.del(
        `forgot-password:email:${forgotPasswordData.email}`,
      );

      throw new AccountServiceError(
        400,
        "Bạn đã nhập sai OTP quá số lần cho phép!",
        {
          data: { otpError: true },
          clearOtpCookie: true,
        },
      );
    }

    const ttl = await redisClient.ttl(challengeKey);
    if ((ttl as number) > 0) {
      await redisClient.set(challengeKey, JSON.stringify(forgotPasswordData), {
        EX: Number(ttl),
      });
    }

    throw new AccountServiceError(400, "OTP không hợp lệ!", {
      data: { otpError: true },
    });
  }

  forgotPasswordData.isOtpVerified = true;
  const ttl = await redisClient.ttl(challengeKey);
  if ((ttl as number) > 0) {
    await redisClient.set(challengeKey, JSON.stringify(forgotPasswordData), {
      EX: Number(ttl),
    });
  }
}

export async function resetPassword(input: {
  password: string;
  challengeKey?: string;
  forgotPasswordData?: ForgotPasswordRedisData;
}): Promise<void> {
  const { password, challengeKey, forgotPasswordData } = input;

  if (!challengeKey || !forgotPasswordData) {
    throw new AccountServiceError(
      400,
      "Phiên xác thực không hợp lệ hoặc đã hết hạn!",
      { clearOtpCookie: true },
    );
  }

  if (!forgotPasswordData.isOtpVerified) {
    throw new AccountServiceError(
      400,
      "Vui lòng xác thực OTP trước khi đổi mật khẩu!",
    );
  }

  const newPassword = await hashPassword(password);
  await AccountModel.updatePassword(forgotPasswordData.email, newPassword);

  await redisClient.del(challengeKey);
  await redisClient.del(`forgot-password:email:${forgotPasswordData.email}`);

  const resetSuccessTitle = "Đổi mật khẩu thành công";
  const resetSuccessContent = emailTemplate.getPasswordResetSuccessTemplate();
  try {
    await enqueueSendMail({
      email: forgotPasswordData.email,
      title: resetSuccessTitle,
      content: resetSuccessContent,
    });
  } catch (queueError) {
    console.error("Failed to enqueue reset-success email:", queueError);
  }
}

export async function refreshToken(input: { refreshToken?: string }): Promise<{
  accessToken: string;
  user: { userId: number; email: string; role: number };
}> {
  const refreshToken = input.refreshToken;

  if (!refreshToken) {
    throw new AccountServiceError(401, "Refresh token không tồn tại");
  }

  let decodedToken: TokenData;
  try {
    decodedToken = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET!,
    ) as TokenData;
  } catch (error) {
    throw new AccountServiceError(
      401,
      "Refresh token không hợp lệ hoặc đã hết hạn",
      { clearAuthCookies: true },
    );
  }

  const refreshTokenKey = `refresh_token:${decodedToken.id}`;
  const storedToken = await redisClient.get(refreshTokenKey);

  if (!storedToken || storedToken !== refreshToken) {
    throw new AccountServiceError(401, "Refresh token không hợp lệ", {
      clearAuthCookies: true,
    });
  }

  const existedAccount = await AccountModel.findUserByEmail(decodedToken.email);
  if (!existedAccount || existedAccount.user_status == "ban") {
    await redisClient.del(refreshTokenKey);
    throw new AccountServiceError(
      401,
      "Tài khoản không tồn tại hoặc đã bị khóa",
      {
        clearAuthCookies: true,
      },
    );
  }

  const tokenPayload = createTokenPayload({
    id: decodedToken.id,
    role: decodedToken.role,
    email: decodedToken.email,
  });
  const newAccessToken = generateAccessToken(tokenPayload);

  return {
    accessToken: newAccessToken,
    user: {
      userId: decodedToken.id,
      email: decodedToken.email,
      role: decodedToken.role,
    },
  };
}
