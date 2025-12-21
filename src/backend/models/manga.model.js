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
  return db("pages").insert(data).returning("page_id");
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

module.exports.updateChapterStatus = async (chapterId, status, price) => {
  return db("chapters")
    .where("chapter_id", chapterId)
    .update({ status, price: price });
};

module.exports.getChapterByChapterId = async (chapterId) => {
  return db("chapters").where("chapter_id", chapterId).first();
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

// filter manga
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

  const minCh = Number.isFinite(Number(chaptersMin))
    ? Number(chaptersMin)
    : null;
  const maxCh = Number.isFinite(Number(chaptersMax))
    ? Number(chaptersMax)
    : null;

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
      if (minCh !== null)
        q.havingRaw("COUNT(DISTINCT c.chapter_id) >= ?", [minCh]);
      if (maxCh !== null)
        q.havingRaw("COUNT(DISTINCT c.chapter_id) <= ?", [maxCh]);
    })
    .orderBy("m.created_at", "desc");

  return qb;
};

module.exports.addFavoriteManga = async (userId, mangaId) => {
  return db("favorites").insert({ user_id: userId, manga_id: mangaId });
};

module.exports.removeFavoriteManga = async (userId, mangaId) => {
  return db("favorites").where({ user_id: userId, manga_id: mangaId }).del();
};

module.exports.getFavoriteMangasByUserId = async (userId) => {
  return db("favorites")
    .join("mangas", "favorites.manga_id", "mangas.manga_id")
    .where("favorites.user_id", userId)
    .select("mangas.*");
};

module.exports.isMangaFavoritedByUser = async (userId, mangaId) => {
  const result = await db("favorites")
    .where({ user_id: userId, manga_id: mangaId })
    .first();
  return !!result;
};

module.exports.calculateAverageRating = async (mangaId) => {
  const result = await db("mangas")
    .join("chapters", "mangas.manga_id", "chapters.manga_id")
    .leftJoin("comments", "chapters.chapter_id", "comments.chapter_id")
    .where("mangas.manga_id", mangaId)
    .avg("comments.rating as average_rating")
    .first();

  return result?.average_rating ? parseFloat(result.average_rating) : 0;
};

module.exports.getPurchasedChaptersList = async (userId) => {
  return db("purchased_chapters").where("user_id", userId).select("chapter_id");
};

// Translation-related functions
module.exports.getPageByChapterAndLanguage = async (
  chapterId,
  pageNumber,
  language
) => {
  return db("pages")
    .where({
      chapter_id: chapterId,
      page_number: pageNumber,
      language: language,
    })
    .first();
};

module.exports.updatePageImageUrl = async (pageId, imageUrl) => {
  return db("pages").where("page_id", pageId).update({ image_url: imageUrl });
};

module.exports.getChapterPagesByLanguage = async (chapterId, language) => {
  return db("pages")
    .where({
      chapter_id: chapterId,
      language: language,
    })
    .orderBy("page_number", "asc");
};

module.exports.searchMangaBySlug = async ({ slug, limit = 20, offset = 0 }) => {
  const pattern = `%${slug}%`;

  const rows = await db("mangas as m")
    .leftJoin("authors as a", "a.author_id", "m.author_id")
    .leftJoin("manga_genre as mg", "mg.manga_id", "m.manga_id")
    .leftJoin("genres as g", "g.genre_id", "mg.genre_id")
    .leftJoin("chapters as c", "c.manga_id", "m.manga_id")
    .whereRaw("m.slug ILIKE ?", [pattern])
    .groupBy(
      "m.manga_id",
      "m.title",
      "m.slug",
      "m.description",
      "m.cover_image",
      "m.status",
      "m.original_language",
      "m.created_at",
      "m.updated_at",
      "a.author_name"
    )
    .select(
      "m.manga_id",
      "m.title",
      "m.slug",
      "m.description",
      "m.cover_image",
      "m.status",
      "m.original_language",
      "m.created_at",
      "m.updated_at",
      db.raw("COALESCE(a.author_name, 'Unknown') as author_name"),
      db.raw("COUNT(DISTINCT c.chapter_id)::int as total_chapters"),
      db.raw("ARRAY_REMOVE(ARRAY_AGG(DISTINCT g.genre_name), NULL) as genres")
    )
    .orderByRaw("m.updated_at DESC NULLS LAST")
    .limit(limit)
    .offset(offset);

  return rows; // trả thẳng list mangas có đủ field
};

module.exports.getMangasByAuthorId = async (authorId) => {
  return db("mangas")
    .where("author_id", authorId)
    .select("*")
    .orderBy("manga_id", "asc");
};
