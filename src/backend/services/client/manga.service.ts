import * as MangaModel from "../../models/manga.model";

export interface ListMangasInput {
  page: number;
  limit: number;
}

export interface ExploreMangaItem {
  mangaId: number;
  slug: string;
  title: string;
  authorId: number | null;
  authorName: string;
  coverImage: string | null;
  status: string;
  totalChapters: number;
  averageRating: number;
  genres: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ListMangasResult {
  data: ExploreMangaItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface PublicMangaOverview {
  manga: any;
}

interface PublicMangaChapters {
  manga_id: number;
  chapters: any[];
  usedChapterList: Array<{ chapter_id: number }>;
}

export const listMangas = async (
  params: ListMangasInput,
): Promise<ListMangasResult> => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 12));

  const [rows, totalItems] = await Promise.all([
    MangaModel.listPublicMangas({
      page,
      limit,
    }),
    MangaModel.countPublicMangas(),
  ]);

  const mangaIds = rows.map((row) => row.manga_id);
  const genreRows = await MangaModel.getGenresByMangaIds(mangaIds);

  const genresMap = new Map<number, string[]>();
  for (const row of genreRows) {
    const current = genresMap.get(row.manga_id) || [];
    current.push(row.genre_name);
    genresMap.set(row.manga_id, current);
  }

  const data: ExploreMangaItem[] = rows.map((row) => ({
    mangaId: row.manga_id,
    slug: row.slug || String(row.manga_id),
    title: row.title,
    authorId: row.author_id ?? null,
    authorName: row.author_name || "Unknown",
    coverImage: row.cover_image ?? null,
    status: row.status,
    totalChapters: Number(row.total_chapters || 0),
    averageRating: Number(row.average_rating || 0),
    genres: genresMap.get(row.manga_id) || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: totalItems > 0 ? Math.ceil(totalItems / limit) : 0,
    },
  };
};

const buildMangaOverview = async (manga: any): Promise<any> => {
  const mangaId = Number(manga.manga_id);

  const [genres, author, chapters, averageRating] = await Promise.all([
    MangaModel.getGenresByMangaId(mangaId),
    manga.author_id
      ? MangaModel.getAuthorDetailByAuthorId(manga.author_id)
      : null,
    MangaModel.getPublishedChaptersByMangaId(mangaId),
    MangaModel.calculateAverageRating(mangaId),
  ]);

  return {
    ...manga,
    genres: genres.map((g) => g.genre_name),
    author_name: author ? author.author_name : "Unknown",
    totalChapters: chapters.length,
    average_rating: averageRating,
  };
};

export const getPublicMangaOverviewBySlug = async (
  slug: string,
): Promise<PublicMangaOverview | null> => {
  const manga = await MangaModel.getMangaBySlug(slug);
  if (!manga) return null;

  const finalManga = await buildMangaOverview(manga);
  return { manga: finalManga };
};

export const getPublicMangaChaptersBySlug = async (
  slug: string,
  userId?: number,
): Promise<PublicMangaChapters | null> => {
  const manga = await MangaModel.getMangaBySlug(slug);
  if (!manga) return null;

  const chapters = await MangaModel.getPublishedChaptersByMangaId(
    manga.manga_id,
  );
  const usedChapterList = userId
    ? await MangaModel.getPurchasedChaptersList(userId)
    : [];

  return {
    manga_id: manga.manga_id,
    chapters,
    usedChapterList,
  };
};
