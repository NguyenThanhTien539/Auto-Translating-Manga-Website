import db from "../config/database.config";
import { UserInfo } from "../types";

interface AccountData {
  email: string;
  full_name: string;
  password: string;
  username: string;
}

interface ProfileUpdateData {
  username?: string;
  full_name?: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

export const insertAccount = async (data: AccountData): Promise<void> => {
  await db("users").insert(data);
};

export const findEmail = async (
  email: string,
): Promise<UserInfo | undefined> => {
  return db("users").select("*").where({ email }).first();
};

export const findId = async (
  user_id: number,
): Promise<UserInfo | undefined> => {
  return db("users").select("*").where({ user_id }).first();
};

export const findEmailAndId = async (
  email: string,
  id: number,
): Promise<UserInfo | undefined> => {
  return db("users").select("*").where({ email, id }).first();
};

export const findAminAuthToken = async (
  user_id: number,
  email: string,
  role_id: number,
): Promise<UserInfo | undefined> => {
  return db("users").select("*").where({ user_id, email, role_id }).first();
};

export const findPassword = async (
  password: string,
): Promise<UserInfo | undefined> => {
  return db("users").select("*").where({ password }).first();
};

export const countAccounts = async (): Promise<number> => {
  const result = await db("users").count("user_id as count").first();
  return Number(result?.count || 0);
};

export const updatePassword = async (
  email: string,
  newPassword: string,
): Promise<number> => {
  return db("users").where({ email: email }).update({ password: newPassword });
};

export const updateProfile = async (
  user_id: number,
  data: ProfileUpdateData,
): Promise<number> => {
  return db("users").where({ user_id: user_id }).update(data);
};

export const checkUsernameExists = async (
  username: string,
): Promise<UserInfo | undefined> => {
  return db("users").select("*").where({ username }).first();
};

export const getAllUsers = async (): Promise<UserInfo[]> => {
  const result = await db("users")
    .select("*")
    .join("role", "users.role_id", "role.role_id")
    .whereNot("role.role_name", "Admin");
  return result;
};

export const getUserById = async (
  user_id: number,
): Promise<UserInfo | undefined> => {
  return db("users")
    .select("*")
    .join("role", "users.role_id", "role.role_id")
    .where({ user_id })
    .first();
};

export const updateUserById = async (
  user_id: number,
  data: Partial<UserInfo>,
): Promise<number> => {
  return db("users").where({ user_id: user_id }).update(data);
};

export const updateRoleById = async (
  user_id: number,
  role_id: number,
): Promise<number> => {
  return db("users").where({ user_id: user_id }).update({ role_id: role_id });
};

export const updateCoinById = async (
  user_id: number,
  coin: number,
): Promise<number> => {
  return db("users").where({ user_id: user_id }).update({ coin_balance: coin });
};
