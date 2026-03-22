import db from "../config/database.config";

interface OtpRecord {
  email: string;
  otp: string;
  otp_expiry?: Date;
}

export const insertOtpAndEmail = async (
  email: string,
  otp: string,
): Promise<number[]> => {
  return db("otp_codes").insert({ email: email, otp: otp });
};

export const findEmail = async (
  email: string,
): Promise<OtpRecord | undefined> => {
  return db("otp_codes").select("*").where({ email }).first();
};

export const findEmailAndOtp = async (
  email: string,
  otp: string,
): Promise<OtpRecord | undefined> => {
  return db("otp_codes").select("*").where({ email, otp }).first();
};

export const deleteExpiredOTP = async (): Promise<number> => {
  return db("otp_codes").where("otp_expiry", "<", db.fn.now()).del();
};

export const deleteOtpByEmail = async (email: string): Promise<number> => {
  return db("otp_codes").where({ email }).del();
};
