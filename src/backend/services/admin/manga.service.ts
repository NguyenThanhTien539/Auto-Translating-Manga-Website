import crypto from "crypto";
import db from "../../config/database.config";
import * as accountModel from "../../models/account.model";
import * as mangaModel from "../../models/manga.model";

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

export const getListManga = async (): Promise<any[]> => {
  const mangaList = await mangaModel.getAllMangas();

  const enhancedMangas = await Promise.all(
    mangaList.map(async (manga) => {
      const [uploader, author] = await Promise.all([
        manga.uploader_id ? accountModel.getUserById(manga.uploader_id) : null,
        manga.author_id
          ? mangaModel.getAuthorDetailByAuthorId(manga.author_id)
          : null,
      ]);

      return {
        ...manga,
        uploader_name: uploader?.username,
        author: author ? author.author_name : "N/A",
      };
    }),
  );

  return enhancedMangas;
};

export const updateMangaStatus = async (
  mangaId: number,
  status: string,
): Promise<void> => {
  await mangaModel.updateMangaStatus(mangaId, status);

  const chapters = await mangaModel.getChaptersByMangaId(mangaId);
  if (status === "OnGoing") {
    await Promise.all(
      chapters.map((chapter) =>
        mangaModel.updateChapterStatus(chapter.chapter_id, "Published"),
      ),
    );
  }

  if (status === "Rejected") {
    await Promise.all(
      chapters.map((chapter) =>
        mangaModel.updateChapterStatus(chapter.chapter_id, "Rejected"),
      ),
    );
  }
};

export const updateChapterStatus = async (
  chapterId: number,
  status: string,
  coinPrice?: number,
): Promise<void> => {
  await mangaModel.updateChapterStatus(chapterId, status, coinPrice);
};

export const rejectManga = async (mangaId: number): Promise<void> => {
  await db("mangas").where("manga_id", mangaId).update({ status: "Dropped" });
};

export const getMangaDetail = async (mangaId: number): Promise<any | null> => {
  const manga = await mangaModel.getMangaById(mangaId);
  if (!manga) return null;

  const [author, genres, averageRating, chapters, totalChapter] =
    await Promise.all([
      manga.author_id
        ? mangaModel.getAuthorDetailByAuthorId(manga.author_id)
        : null,
      mangaModel.getGenresByMangaId(mangaId),
      mangaModel.calculateAverageRating(mangaId),
      mangaModel.getChaptersByMangaId(mangaId),
      mangaModel.countChaptersByMangaId(mangaId),
    ]);

  const enrichedManga = {
    ...manga,
    author_name: author ? author.author_name : "N/A",
    genres: genres.map((g) => g.genre_name),
    average_rating: averageRating,
    totalChapters: totalChapter,
  };

  return {
    manga: enrichedManga,
    chapters,
  };
};

export const getChapterPages = async (
  chapterId: number,
  baseUrl: string,
): Promise<any[]> => {
  const pages = await mangaModel.getChapterPages(chapterId);

  return pages.map((page) => {
    const token = generateSignedToken(page.page_id, 3600);

    return {
      page_id: page.page_id,
      page_number: page.page_number,
      language: page.language,
      chapter_id: page.chapter_id,
      image_url: `${baseUrl}/mangas/page-image/${page.page_id}?token=${token}`,
    };
  });
};

export const setHighlightManga = async (
  mangaId: number,
  isHighlightInput: boolean | string,
  highlightDurationInput: number | string,
): Promise<{ is_highlight: boolean }> => {
  const isHighlight =
    isHighlightInput === true || String(isHighlightInput) === "true";
  const highlightDuration = Number(highlightDurationInput) || 0;

  const dataToUpdate: {
    is_highlighted: boolean;
    highlight_end_at: Date | null;
  } = {
    is_highlighted: isHighlight,
    highlight_end_at: null,
  };

  if (isHighlight) {
    const days = highlightDuration > 0 ? highlightDuration : 7;
    dataToUpdate.highlight_end_at = new Date(Date.now() + days * 86400000);
  }

  await mangaModel.setHighlightManga(mangaId, dataToUpdate);

  return { is_highlight: isHighlight };
};
