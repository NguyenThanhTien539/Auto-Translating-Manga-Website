import { Knex } from "knex";
import db from "../config/database.config";
import { Manga, UserInfo } from "../types";

interface UserData {
  email: string;
  full_name: string;
  password?: string;
  username: string;
}

interface UserProviderData {
  user_id: number;
  provider: string;
  provider_id: string;
}

interface ProviderDataInput {
  provider: string;
  provider_id: string;
}

interface ProfileUpdateData {
  username?: string;
  full_name?: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

async function createUser(
  trx: Knex.Transaction,
  data: UserData,
): Promise<{ user_id: number }> {
  const [user] = await trx("users").insert(data).returning("user_id");
  return user;
}

async function findUserByIdInTransaction(
  trx: Knex.Transaction,
  user_id: number,
): Promise<UserInfo | undefined> {
  return trx("users").select("*").where({ user_id }).first();
}

async function createUserProvider(
  trx: Knex.Transaction,
  data: UserProviderData,
): Promise<void> {
  await trx("user_providers").insert(data);
}

export const createAccount = async (
  userData: UserData,
  providerData: ProviderDataInput,
): Promise<UserInfo> => {
  return db.transaction(async (trx) => {
    const user = await createUser(trx, userData);
    console.log("Created user with ID:", user.user_id);
    await createUserProvider(trx, {
      ...providerData,
      user_id: user.user_id,
    });

    const createdUser = await findUserByIdInTransaction(trx, user.user_id);
    if (!createdUser) {
      throw new Error("Cannot fetch created user");
    }

    return createdUser;
  });
};

export const findUserByEmail = async (
  email: string,
): Promise<UserInfo | undefined> => {
  return db("users").select("*").where({ email }).first();
};

export const findUserProvider = async (
  user_id: number,
  provider: string,
): Promise<UserProviderData | undefined> => {
  return db("user_providers").where({ user_id, provider }).first();
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

export const existUserByEmail = async (email: string): Promise<boolean> => {
  const user = await db("users").select("*").where({ email }).first();
  return !!user;
};

export const getFavoriteMangaListByUserId = async (
  userId: number,
): Promise<Manga[]> => {
  return db("favorites")
    .join("mangas", "favorites.manga_id", "mangas.manga_id")
    .where("favorites.user_id", userId)
    .select("mangas.*");
};
