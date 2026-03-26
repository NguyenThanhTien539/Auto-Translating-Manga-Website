export const pathAdmin: string = "admin";

export const ttlSeconds = 2 * 60; // time to live for OTP in seconds (2 minutes)

// Access token: 15 minutes
export const accessTokenTtl = 15 * 60; // 15 minutes in seconds

// Refresh token: 7 days
export const refreshTokenTtl = 7 * 24 * 60 * 60; // 7 days in seconds

export const OTPLength = 6; // length of the OTP code

export const saltRounds = 10; // number of salt rounds for bcrypt

export enum Provider {
  LOCAL = "local",
  GOOGLE = "google",
  FACEBOOK = "facebook",
}
