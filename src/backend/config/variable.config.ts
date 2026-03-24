export const pathAdmin: string = "admin";

export const ttlSeconds = 2 * 60; // time to live for OTP in seconds (2 minutes)

export const accessTokenTtlDefault = 24 * 60 * 60 * 1000; // 1 day in milliseconds

export const accessTokenTtlRememberMe = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

export const OTPLength = 6; // length of the OTP code

export const saltRounds = 10; // number of salt rounds for bcrypt
