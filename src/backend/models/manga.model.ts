import db from "../config/database.config";
import { Manga, Chapter, Page, Author, Genre, FilterParams } from "../types";

interface MangaData {
  title: string;
  author_id?: number;
  description?: string;
  cover_image?: string;
  uploader_id?: number;
  status?: string;
  original_language?: string;
  slug?: string;
  processing_error?: string | null;
  review_note?: string | null;
}

interface ChapterData {
  manga_id: number;
  uploader_id?: number;
  chapter_number: number;
  title?: string;
  status?: string;
  processing_error?: string | null;
  review_note?: string | null;
}

interface PageData {
  chapter_id: number;
  image_url: string;
  page_number: number;
  language?: string;
  cloudinary_public_id?: string | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  bytes?: number | null;
}

interface MangaGenreData {
  manga_id: number;
  genre_id: number;
}

interface FilterPanelData {
  status: { status: string }[];
  languages: { language_code: string; language_name: string }[];
  genres: { genre_id: number; genre_name: string }[];
}

interface PurchasedChapter {
  chapter_id: number;
}

interface ChapterReadingData {
  chapter_id: number;
  last_page_read: number | null;
  total_pages: number | null;
}

export interface PublicMangaListFilters {
  page: number;
  limit: number;
}

export interface PublicMangaListRow {
  manga_id: number;
  slug: string | null;
  title: string;
  author_id: number | null;
  author_name: string;
  cover_image: string | null;
  status: string;
  total_chapters: number;
  average_rating: number;
  created_at: Date | string;
  updated_at: Date | string;
}

const PUBLIC_MANGA_STATUSES = ["published"];
const PUBLIC_CHAPTER_STATUSES = ["published"];

export const createManga = async (data: MangaData): Promise<{ id: number }> => {
  const [id] = await db("mangas").insert(data).returning("manga_id");
  return { id: typeof id === "object" ? (id as any).manga_id : id };
};

export const createChapter = async (
  data: ChapterData,
): Promise<{ id: number }> => {
  const [id] = await db("chapters").insert(data).returning("chapter_id");
  return { id: typeof id === "object" ? (id as any).chapter_id : id };
};

export const createPages = async (
  data: PageData[],
): Promise<{ page_id: number }[]> => {
  return db("pages").insert(data).returning("page_id");
};

export const getMangaById = async (id: number): Promise<Manga | undefined> => {
  return db("mangas").where("manga_id", id).first();
};

export const getMangaBySlug = async (
  slug: string,
): Promise<Manga | undefined> => {
  return db("mangas").where("slug", slug).first();
};

export const getPublishedChaptersByMangaId = async (
  mangaId: number,
): Promise<Chapter[]> => {
  return db("chapters")
    .where("manga_id", mangaId)
    .whereIn("status", PUBLIC_CHAPTER_STATUSES)
    .orderBy("chapter_number", "asc");
};

export const getChaptersByMangaId = async (
  mangaId: number,
): Promise<Chapter[]> => {
  return db("chapters")
    .where("manga_id", mangaId)
    .orderBy("chapter_number", "asc");
};

export const getMangasByUploader = async (
  uploaderId: number,
): Promise<Manga[]> => {
  return db("mangas")
    .where("uploader_id", uploaderId)
    .select("*")
    .orderBy("manga_id", "asc");
};

export const getAllMangas = async (): Promise<Manga[]> => {
  return db("mangas").select("*").orderBy("manga_id", "asc");
};

export const listPublicMangas = async (
  filters: PublicMangaListFilters,
): Promise<PublicMangaListRow[]> => {
  const { page, limit } = filters;

  const chapterCountSubquery = db("chapters as c")
    .select("c.manga_id")
    .countDistinct("c.chapter_id as total_chapters")
    .groupBy("c.manga_id")
    .as("chapter_counts");

  const averageRatingSubquery = db("chapters as c")
    .leftJoin("comments as cm", "cm.chapter_id", "c.chapter_id")
    .select("c.manga_id")
    .avg("cm.rating as average_rating")
    .groupBy("c.manga_id")
    .as("rating_stats");

  const rows = await db("mangas as m")
    .leftJoin("authors as a", "a.author_id", "m.author_id")
    .leftJoin(chapterCountSubquery, "chapter_counts.manga_id", "m.manga_id")
    .leftJoin(averageRatingSubquery, "rating_stats.manga_id", "m.manga_id")
    .whereIn("m.status", PUBLIC_MANGA_STATUSES)
    .select(
      "m.manga_id",
      "m.slug",
      "m.title",
      "m.author_id",
      "m.cover_image",
      "m.status",
      "m.created_at",
      "m.updated_at",
      db.raw("COALESCE(a.author_name, 'Unknown') as author_name"),
      db.raw(
        "COALESCE(chapter_counts.total_chapters, 0)::int as total_chapters",
      ),
      db.raw(
        "COALESCE(rating_stats.average_rating, 0)::float as average_rating",
      ),
    )
    .orderBy("m.updated_at", "asc")
    .orderBy("m.manga_id", "asc")
    .limit(limit)
    .offset((page - 1) * limit);

  return rows as PublicMangaListRow[];
};

export const countPublicMangas = async (): Promise<number> => {
  const result = await db("mangas as m")
    .whereIn("m.status", PUBLIC_MANGA_STATUSES)
    .countDistinct("m.manga_id as count")
    .first();

  return parseInt(String(result?.count || 0), 10);
};

export const getGenresByMangaIds = async (
  mangaIds: number[],
): Promise<Array<{ manga_id: number; genre_name: string }>> => {
  if (mangaIds.length === 0) {
    return [];
  }

  return db("manga_genre as mg")
    .innerJoin("genres as g", "g.genre_id", "mg.genre_id")
    .whereIn("mg.manga_id", mangaIds)
    .select("mg.manga_id", "g.genre_name")
    .orderBy("g.genre_name", "asc");
};

export const getAllLanguages = async (): Promise<
  { language_code: string; language_name: string }[]
> => {
  return db("languages").select("*");
};

export const getAllGenres = async (): Promise<Genre[]> => {
  return db("genres").select("*");
};

export const createMangaGenres = async (
  data: MangaGenreData[],
): Promise<number[]> => {
  return db("manga_genre").insert(data);
};

export const countChaptersByMangaId = async (
  mangaId: number,
): Promise<number> => {
  const result = await db("chapters")
    .where("manga_id", mangaId)
    .count("chapter_id as count")
    .first();
  return parseInt(String(result?.count || 0));
};

export const getGenresByMangaId = async (
  mangaId: number,
): Promise<{ genre_id: number; genre_name: string }[]> => {
  return db("manga_genre")
    .join("genres", "manga_genre.genre_id", "genres.genre_id")
    .where("manga_genre.manga_id", mangaId)
    .select("genres.genre_id", "genres.genre_name");
};

export const getChapterPages = async (chapterId: number): Promise<Page[]> => {
  return db("pages").where("chapter_id", chapterId);
};

export const createAuthor = async (data: {
  author_name: string;
  biography?: string;
  avatar_url?: string;
}): Promise<{ id: number }> => {
  const [id] = await db("authors").insert(data).returning("author_id");
  return { id: typeof id === "object" ? (id as any).author_id : id };
};

export const getOriginalLanguageByMangaId = async (
  id: number,
): Promise<string | null> => {
  const manga = await db("mangas").where("manga_id", id).first();
  return manga ? manga.original_language : null;
};

export const getAuthorDetailByAuthorId = async (
  authorId: number,
): Promise<Author | undefined> => {
  return db("authors").where("author_id", authorId).first();
};

export const getPageById = async (
  pageId: number,
): Promise<Page | undefined> => {
  return db("pages").where("page_id", pageId).first();
};

export const updateMangaStatus = async (
  mangaId: number,
  status: string,
): Promise<number> => {
  return db("mangas").where("manga_id", mangaId).update({
    status,
    updated_at: db.fn.now(),
  });
};

export const updateMangaWorkflowState = async (
  mangaId: number,
  payload: {
    status?: string;
    processing_error?: string | null;
    review_note?: string | null;
  },
): Promise<number> => {
  return db("mangas")
    .where("manga_id", mangaId)
    .update({
      ...payload,
      updated_at: db.fn.now(),
    });
};

export const updateChapterStatus = async (
  chapterId: number,
  status: string,
  price?: number,
): Promise<number> => {
  return db("chapters")
    .where("chapter_id", chapterId)
    .update({ status, price: price });
};

export const updateChapterWorkflowState = async (
  chapterId: number,
  payload: {
    status?: string;
    processing_error?: string | null;
    review_note?: string | null;
    published_at?: Date | null;
    price?: number;
  },
): Promise<number> => {
  return db("chapters").where("chapter_id", chapterId).update(payload);
};

export const getChapterByChapterId = async (
  chapterId: number,
): Promise<Chapter | undefined> => {
  return db("chapters").where("chapter_id", chapterId).first();
};

export const getChapterByMangaAndNumber = async (
  mangaId: number,
  chapterNumber: number,
): Promise<Chapter | undefined> => {
  return db("chapters")
    .where("manga_id", mangaId)
    .andWhere("chapter_number", chapterNumber)
    .first();
};

export const getHighestChapterNumberByMangaId = async (
  mangaId: number,
): Promise<number> => {
  const row = await db("chapters")
    .where("manga_id", mangaId)
    .max("chapter_number as max_chapter")
    .first();
  return Number(row?.max_chapter || 0);
};

export const getFilterPanelData = async (): Promise<FilterPanelData> => {
  const status = await db("mangas").select("status").distinct();

  const languages = await db("languages")
    .select("language_code", "language_name")
    .orderBy("language_name", "asc");

  const genres = await db("genres")
    .select("genre_id", "genre_name")
    .orderBy("genre_name", "asc");

  return { status, languages, genres };
};

export const filterMangas = async (
  filters: FilterParams = {},
): Promise<any[]> => {
  let { chaptersMin, chaptersMax, state, categories } = filters;

  if (Array.isArray(state)) state = state[0];

  const genreNamesLower = Array.from(
    new Set(
      (Array.isArray(categories) ? categories : categories ? [categories] : [])
        .map((x) => String(x).trim())
        .filter(Boolean)
        .map((x) => x.toLowerCase()),
    ),
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
      `),
    )
    .modify((q) => {
      const s = typeof state === "string" ? state.trim() : "";
      if (s && s !== "all") q.where("m.status", s);

      if (genreNamesLower.length > 0) {
        q.whereExists(function (this: any) {
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
      "m.created_at",
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

export const getFinishedAndReadingCount = async (
  userId: number,
): Promise<{ finished_count: number; reading_count: number }> => {
  const chaptersData: ChapterReadingData[] = await db("chapters as c")
    .leftJoin("reading_history as rh", function (this: any) {
      this.on("rh.chapter_id", "c.chapter_id").andOn("rh.user_id", userId);
    })
    .leftJoin("pages as p", "p.chapter_id", "c.chapter_id")
    .select(
      "c.chapter_id",
      db.raw("MAX(rh.last_page_read) as last_page_read"),
      db.raw("MAX(p.page_number) as total_pages"),
    )
    .groupBy("c.chapter_id");

  let finished_count = 0;
  let reading_count = 0;

  chaptersData.forEach((chapter) => {
    const { last_page_read, total_pages } = chapter;
    const last = last_page_read || 0;
    const total = total_pages || 0;

    if (total > 0) {
      if (last === total) {
        finished_count++;
      } else if (last > 0 && last < total) {
        reading_count++;
      }
    }
  });

  return {
    finished_count,
    reading_count,
  };
};

export const calculateAverageRating = async (
  mangaId: number,
): Promise<number> => {
  const result = await db("mangas")
    .join("chapters", "mangas.manga_id", "chapters.manga_id")
    .leftJoin("comments", "chapters.chapter_id", "comments.chapter_id")
    .where("mangas.manga_id", mangaId)
    .avg("comments.rating as average_rating")
    .first();

  return result?.average_rating ? parseFloat(String(result.average_rating)) : 0;
};

export const getPurchasedChaptersList = async (
  userId: number,
): Promise<PurchasedChapter[]> => {
  return db("purchased_chapters").where("user_id", userId).select("chapter_id");
};

export const getPageByChapterAndLanguage = async (
  chapterId: number,
  pageNumber: number,
  language: string,
): Promise<Page | undefined> => {
  return db("pages")
    .where({
      chapter_id: chapterId,
      page_number: pageNumber,
      language: language,
    })
    .first();
};

export const updatePageImageUrl = async (
  pageId: number,
  imageUrl: string,
): Promise<number> => {
  return db("pages").where("page_id", pageId).update({ image_url: imageUrl });
};

export const getChapterPagesByLanguage = async (
  chapterId: number,
  language: string,
): Promise<Page[]> => {
  return db("pages")
    .where({
      chapter_id: chapterId,
      language: language,
    })
    .orderBy("page_number", "asc");
};

export const getMangasByAuthorId = async (
  authorId: number,
): Promise<Manga[]> => {
  return db("mangas")
    .where("author_id", authorId)
    .select("*")
    .orderBy("manga_id", "asc");
};

export const setHighlightManga = async (
  mangaId: number,
  dataToUpdate: { is_highlighted: boolean; highlight_end_at: Date | null },
): Promise<number> => {
  return db("mangas").where("manga_id", mangaId).update(dataToUpdate);
};
