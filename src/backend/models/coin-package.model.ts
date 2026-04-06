import db from "../config/database.config";
import { CoinPackage } from "../types";

export const getAllCoinPackages = async (): Promise<CoinPackage[]> => {
  return db("coin_packages").select("*").where({ is_active: true });
};

export const getOrderDetailById = async (
  id: number,
): Promise<CoinPackage | undefined> => {
  return db("coin_packages").select("*").where({ id: id }).first();
};
