const db = require("../config/database.config");

module.exports.createManga = async (data) => {
  const [id] = await db("mangas").insert(data).returning("manga_id");
  return { id: typeof id === 'object' ? id.manga_id : id };
};

module.exports.createChapter = async (data) => {
  const [id] = await db("chapters").insert(data).returning("chapter_id");
  return { id: typeof id === 'object' ? id.chapter_id : id };
};

module.exports.createPages = async (data) => {
  return db("pages").insert(data);
};

module.exports.getMangaById = async (id) => {
  return db("mangas").where("manga_id", id).first();
};

module.exports.getChaptersByMangaId = async (mangaId) => {
  return db("chapters").where("manga_id", mangaId);
};

module.exports.getMangasByUploader = async (uploaderId) => {
  return db("mangas").where("uploader_id", uploaderId).select("manga_id as id", "title");
};

module.exports.getAllMangas = async () => {
    return db("mangas").select("*");
};
