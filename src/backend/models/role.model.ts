import db from "../config/database.config";
import { Role } from "../types";

export const findById = async (role_id: number): Promise<Role | undefined> => {
  return db("role").select("*").where({ role_id }).first();
};

export const findByCode = async (
  role_code: string,
): Promise<Role | undefined> => {
  return db("role").select("*").where({ role_code }).first();
};
