import * as MangaModel from "../../models/manga.model";
import crypto from "crypto";
import { Page } from "../../types";

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

export interface GetChapterPagesForClientInput {
  chapterId: number;
  language?: string;
  protocol: string;
  host?: string;
}

export interface SecureChapterPage {
  page_id: number;
  page_number: number;
  language?: string;
  chapter_id: number;
  translation_status: "original" | "processing" | "not_translated" | "translated";
  image_url: string | null;
}

interface PublicMangaOverview {
  manga: any;
}

interface PublicMangaChapters {
  manga_id: number;
  chapters: any[];
  usedChapterList: Array<{ chapter_id: number }>;
}

const isPublicMangaStatus = (status?: string): boolean => {
  const normalized = String(status || "").toLowerCase();
  return normalized === "published";
};

const URL_SECRET = process.env.URL_SECRET || "your-secret-key-change-this";

const generateSignedToken = (
  pageId: number,
  expiresIn: number = 3600,
): string => {
  const expirationTime = Math.floor(Date.now() / 1000) + expiresIn;
  const data = `${pageId}:${expirationTime}`;
  const signature = crypto
    .createHmac("sha256", URL_SECRET)
    .update(data)
    .digest("hex");
  return `${signature}:${expirationTime}`;
};

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
  if (!manga || !isPublicMangaStatus(manga.status)) return null;

  const finalManga = await buildMangaOverview(manga);
  return { manga: finalManga };
};

export const getPublicMangaChaptersBySlug = async (
  slug: string,
  userId?: number,
): Promise<PublicMangaChapters | null> => {
  const manga = await MangaModel.getMangaBySlug(slug);
  if (!manga || !isPublicMangaStatus(manga.status)) return null;

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

export const getChapterPagesForClient = async (
  params: GetChapterPagesForClientInput,
): Promise<SecureChapterPage[]> => {
  const { chapterId, language, protocol, host } = params;

  let pages: Page[];

  if (language) {
    pages = await MangaModel.getChapterPagesByLanguage(chapterId, language);

    if (pages.length === 0) {
      pages = await MangaModel.getChapterPages(chapterId);
    } else {
      const allOriginalPages = await MangaModel.getChapterPages(chapterId);
      const originalPageNumbers = allOriginalPages.map((p) => p.page_number);
      const translatedPageNumbers = pages.map((p) => p.page_number);

      const missingPageNumbers = originalPageNumbers.filter(
        (num) => !translatedPageNumbers.includes(num),
      );

      const missingPages = allOriginalPages.filter((p) =>
        missingPageNumbers.includes(p.page_number),
      );

      pages = [...pages, ...missingPages].sort(
        (a, b) => a.page_number - b.page_number,
      );
    }
  } else {
    pages = await MangaModel.getChapterPages(chapterId);
  }

  const isLocal = host?.includes("localhost") || host?.includes("127.0.0.1");
  const apiPrefix = isLocal ? "" : "/api";
  const baseUrl = `${protocol}://${host}${apiPrefix}`;

  return pages.map((page) => {
    const token = generateSignedToken(page.page_id, 3600);

    let translationStatus: SecureChapterPage["translation_status"] = "original";

    if (language) {
      if (page.language === language) {
        if (page.image_url === "processing") {
          translationStatus = "processing";
        } else if (page.image_url === "" || !page.image_url) {
          translationStatus = "not_translated";
        } else {
          translationStatus = "translated";
        }
      } else {
        translationStatus = "original";
      }
    }

    return {
      page_id: page.page_id,
      page_number: page.page_number,
      language: page.language,
      chapter_id: page.chapter_id,
      translation_status: translationStatus,
      image_url:
        page.image_url && page.image_url !== "processing" && page.image_url !== ""
          ? `${baseUrl}/mangas/page-image/${page.page_id}?token=${token}`
          : null,
    };
  });
};
