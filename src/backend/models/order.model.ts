import db from "../config/database.config";
import { CoinPackage, DepositTransaction } from "../types";

interface DepositData {
  user_id: number;
  coin_package_id: number;
  payment_method: string;
  status: string;
}

interface DepositHistoryResult {
  deposit_id: number;
  user_id: number;
  coin_package_id: number;
  payment_method: string;
  status: string;
  coins: number;
  price: number;
}

export const getAllCoinPackages = async (): Promise<CoinPackage[]> => {
  return db("coin_packages").select("*").where({ is_active: true });
};

export const getOrderDetailById = async (
  id: number,
): Promise<CoinPackage | undefined> => {
  return db("coin_packages").select("*").where({ id: id }).first();
};

export const createOrder = async (
  orderData: DepositTransaction,
): Promise<number[]> => {
  return db("deposit_transactions").insert(orderData);
};

export const orderChapter = async (orderData: {
  user_id: number;
  chapter_id: number;
  price_at_purchase: number;
}): Promise<number[]> => {
  return db("purchased_chapters").insert(orderData);
};

export const createCoinHistory = async (
  user_id: number,
  amount: number,
  type: string,
): Promise<number[]> => {
  return db("coin_history").insert({ user_id, amount, type });
};

export const getOrderDetailByCode = async (
  orderCode: string,
): Promise<DepositTransaction | undefined> => {
  return db("deposit_transactions")
    .select("*")
    .where({ order_code: orderCode })
    .first();
};

export const createNewDeposit = async (
  finalData: DepositData,
): Promise<number> => {
  const [row] = await db("deposit_transactions")
    .insert(finalData)
    .returning("deposit_id");

  return (row as any).deposit_id;
};

export const updateDepositStatus = (
  depositId: number,
  status: string,
): Promise<number> => {
  return db("deposit_transactions")
    .where({ deposit_id: depositId })
    .update({ status: status });
};

export const getDepositHistoryByUserId = async (
  user_id: number,
  deposit_id: number,
): Promise<DepositHistoryResult[]> => {
  const q = db("deposit_transactions")
    .join(
      "coin_packages",
      "deposit_transactions.coin_package_id",
      "coin_packages.id",
    )
    .where("user_id", user_id)
    .andWhere("deposit_transactions.deposit_id", deposit_id)
    .andWhere("status", "Success");

  return q;
};
