import db from "../config/database.config";

export const addFavoriteManga = async (
  userId: number,
  mangaId: number,
): Promise<number[]> => {
  return db("favorites").insert({ user_id: userId, manga_id: mangaId });
};

export const removeFavoriteManga = async (
  userId: number,
  mangaId: number,
): Promise<number> => {
  return db("favorites").where({ user_id: userId, manga_id: mangaId }).del();
};

export const isMangaFavoritedByUser = async (
  userId: number,
  mangaId: number,
): Promise<boolean> => {
  const result = await db("favorites")
    .where({ user_id: userId, manga_id: mangaId })
    .first();
  return !!result;
};

export const countFavoriteMangasByUserId = async (
  userId: number,
): Promise<number> => {
  const result = await db("favorites")
    .where("user_id", userId)
    .count("manga_id as count")
    .first();
  return parseInt(String(result?.count || 0));
};
