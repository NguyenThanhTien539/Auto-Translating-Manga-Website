const db = require("../config/database.config");

module.exports.updateCoinBalance = async (userId, amount) => {
  return db("users")
    .where("user_id", userId)
    .increment("coin_balance", amount);
}

module.exports.updateCoinHistory = async (data) => {
  return db("coin_history").insert(data);
}

module.exports.getChapterCountByMangaId = async (mangaId) => {
  const row = await db("chapters")
    .where("manga_id", mangaId)
    .count("* as count")
    .first();

  return Number(row?.count || 0);
};