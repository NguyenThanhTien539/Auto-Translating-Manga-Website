import db from "../config/database.config";

interface CoinHistoryData {
  user_id: number;
  amount: number;
  type: string;
}

export const updateCoinBalance = async (
  userId: number,
  amount: number,
): Promise<number> => {
  return db("users").where("user_id", userId).increment("coin_balance", amount);
};

export const updateCoinHistory = async (
  data: CoinHistoryData,
): Promise<number[]> => {
  return db("coin_history").insert(data);
};

export const getChapterCountByMangaId = async (
  mangaId: number,
): Promise<number> => {
  const row = await db("chapters")
    .where("manga_id", mangaId)
    .count("* as count")
    .first();

  return Number(row?.count || 0);
};
