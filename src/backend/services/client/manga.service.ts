import * as MangaModel from "../../models/manga.model";

export interface ListMangasInput {
  page: number;
  limit: number;
}

export interface ExploreMangaItem {
  mangaId: number;
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
