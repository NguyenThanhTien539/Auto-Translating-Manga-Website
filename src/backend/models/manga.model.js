const db = require("../config/database.config");

module.exports.createManga = async (data) => {
  const [id] = await db("mangas").insert(data).returning("manga_id");
  return { id: typeof id === "object" ? id.manga_id : id };
};

module.exports.createChapter = async (data) => {
  const [id] = await db("chapters").insert(data).returning("chapter_id");
  return { id: typeof id === "object" ? id.chapter_id : id };
};

module.exports.createPages = async (data) => {
  return db("pages").insert(data);
};

module.exports.getMangaById = async (id) => {
  return db("mangas").where("manga_id", id).first();
};

module.exports.getChaptersByMangaId = async (mangaId) => {
  return db("chapters").where("manga_id", mangaId).orderBy("chapter_number", "asc");
};

module.exports.getMangasByUploader = async (uploaderId) => {
  return db("mangas")
    .where("uploader_id", uploaderId)
    .select("manga_id ", "title");
};

module.exports.getAllMangas = async () => {
  return db("mangas").select("*");
};

module.exports.getAllLanguages = async () => {
  return db("languages").select("*");
};

module.exports.getAllGenres = async () => {
  return db("genres").select("*");
};

module.exports.createMangaGenres = async (data) => {
  return db("manga_genre").insert(data);
};

module.exports.getAllMangas = async () => {
  return db("mangas").select("*");
};

module.exports.countChaptersByMangaId = async (mangaId) => {
  const result = await db("chapters")
    .where("manga_id", mangaId)
    .count("chapter_id as count")
    .first();
  return parseInt(result.count);
};

module.exports.getGenresByMangaId = async (mangaId) => {
  return db("manga_genre")
    .join("genres", "manga_genre.genre_id", "genres.genre_id")
    .where("manga_genre.manga_id", mangaId)
    .select("genres.genre_id", "genres.genre_name");
};

module.exports.getMangaById = async (id) => {
  return db("mangas").where("manga_id", id).first();
};

module.exports.getChapterPages = async (chapterId) => {
  return db("pages").where("chapter_id", chapterId);
};

module.exports.createAuthor = async (data) => {
  const [id] = await db("authors").insert(data).returning("author_id");
  return { id: typeof id === "object" ? id.author_id : id };
};

module.exports.getOriginalLanguageByMangaId = async (id) => {
  const manga = await db("mangas").where("manga_id", id).first();
  return manga ? manga.original_language : null;
};

module.exports.getAuthorDetailByAuthorId = async (authorId) => {
  return db("authors").where("author_id", authorId).first();
};

module.exports.getPageById = async (pageId) => {
  return db("pages").where("page_id", pageId).first();
};
