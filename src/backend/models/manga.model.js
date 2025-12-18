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

module.exports.getChaptersByMangaIdOfClient = async (mangaId) => {
  return db("chapters")
    .where("manga_id", mangaId)
    .andWhere("status", "Published")
    .orderBy("chapter_number", "asc");
};

module.exports.getChaptersByMangaId = async (mangaId) => {
  return db("chapters")
    .where("manga_id", mangaId)
    .orderBy("chapter_number", "asc");
};

module.exports.getMangasByUploader = async (uploaderId) => {
  return db("mangas")
    .where("uploader_id", uploaderId)
    .select("manga_id ", "title");
};

module.exports.getAllMangas = async () => {
  return db("mangas").select("*").orderBy("manga_id", "asc");
};

module.exports.getAllMangasOfClient = async () => {
  return db("mangas")
    .select("*")
    .whereIn("status", ["OnGoing", "Completed", "Dropped"])
    .orderBy("manga_id", "asc");
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

module.exports.updateMangaStatus = async (mangaId, status) => {
  return db("mangas").where("manga_id", mangaId).update({ status });
};

module.exports.updateChapterStatus = async (chapterId, status) => {
  return db("chapters").where("chapter_id", chapterId).update({ status });
};

module.exports.getChapterByChapterId = async ( chapterId) => {
  return db("chapters")
    .where("chapter_id", chapterId)
    .first();
};

module.exports.getFilterPanelData = async () => {
  const status = await db("mangas").select("status").distinct();

  const languages = await db("languages")
    .select("language_code", "language_name")
    .orderBy("language_name", "asc");

  const genres = await db("genres")
    .select("genre_id", "genre_name")
    .orderBy("genre_name", "asc");

  return { status, languages, genres };
};

// model
module.exports.filterMangas = async (filters = {}) => {
  let { chaptersMin, chaptersMax, state, categories } = filters;

  if (Array.isArray(state)) state = state[0];

  const genreNamesLower = Array.from(
    new Set(
      (Array.isArray(categories) ? categories : categories ? [categories] : [])
        .map((x) => String(x).trim())
        .filter(Boolean)
        .map((x) => x.toLowerCase())
    )
  );

  const minCh = Number.isFinite(Number(chaptersMin)) ? Number(chaptersMin) : null;
  const maxCh = Number.isFinite(Number(chaptersMax)) ? Number(chaptersMax) : null;

  const qb = db("mangas as m")
    .leftJoin("authors as a", "a.author_id", "m.author_id")
    .leftJoin("chapters as c", "c.manga_id", "m.manga_id")
    .leftJoin("manga_genre as mg", "mg.manga_id", "m.manga_id")
    .leftJoin("genres as g", "g.genre_id", "mg.genre_id")
    .select(
      "m.manga_id",
      "m.title",
      "m.description",
      "m.cover_image",
      "m.status",
      "m.original_language",
      "m.created_at",
      db.raw("MAX(a.author_name) as author_name"),
      db.raw("COUNT(DISTINCT c.chapter_id)::int as total_chapters"),
      db.raw(`
        COALESCE(
          array_agg(DISTINCT g.genre_name) FILTER (WHERE g.genre_name IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS genres
      `)
    )
    .modify((q) => {
      // status
      const s = typeof state === "string" ? state.trim() : "";
      if (s && s !== "all") q.where("m.status", s);

      // genre_name AND: phải có đủ tất cả genre đã chọn
      if (genreNamesLower.length > 0) {
        q.whereExists(function () {
          this.select(db.raw("1"))
            .from("manga_genre as mg2")
            .innerJoin("genres as g2", "g2.genre_id", "mg2.genre_id")
            .whereRaw("mg2.manga_id = m.manga_id")
            .whereIn(db.raw("LOWER(TRIM(g2.genre_name))"), genreNamesLower)
            .groupBy("mg2.manga_id")
            .havingRaw("COUNT(DISTINCT LOWER(TRIM(g2.genre_name))) = ?", [
              genreNamesLower.length,
            ]);
        });
      }
    })
    .groupBy(
      "m.manga_id",
      "m.title",
      "m.description",
      "m.cover_image",
      "m.status",
      "m.original_language",
      "m.created_at"
    )
    .modify((q) => {
      if (minCh !== null) q.havingRaw("COUNT(DISTINCT c.chapter_id) >= ?", [minCh]);
      if (maxCh !== null) q.havingRaw("COUNT(DISTINCT c.chapter_id) <= ?", [maxCh]);
    })
    .orderBy("m.created_at", "desc");

  return qb;
};

