const db = require("../config/database.config");

module.exports.addReadingHistory = async (
  userId,
  chapterId,
  mangaId,
  lastPageRead = 1
) => {
  return db("reading_history")
    .insert({
      user_id: userId,
      chapter_id: chapterId,
      manga_id: mangaId,
      last_page_read: lastPageRead,
      last_read_at: db.fn.now(),
    })
    .onConflict(["user_id", "chapter_id"])
    .merge({
      last_page_read: lastPageRead,
      last_read_at: db.fn.now(),
    });
};

module.exports.getReadingHistoryByUser = async (userId) => {
  return db("reading_history")
    .join("mangas", "reading_history.manga_id", "mangas.manga_id")
    .join("chapters", "reading_history.chapter_id", "chapters.chapter_id")
    .where("reading_history.user_id", userId)
    .select(
      "reading_history.*",
      "mangas.title",
      "mangas.cover_image",
      "chapters.title as chapter_title",
      "chapters.chapter_number"
    )
    .orderBy("reading_history.last_read_at", "desc");
};

module.exports.getReadingHistoryByUserAndManga = async (userId, mangaId) => {
  return db("reading_history")
    .where({
      "reading_history.user_id": userId,
      "reading_history.manga_id": mangaId,
    })
    .join("chapters", "reading_history.chapter_id", "chapters.chapter_id")
    .select("reading_history.*", "chapters.chapter_number", "chapters.title")
    .orderBy("chapters.chapter_number", "asc")
    .first();
};
