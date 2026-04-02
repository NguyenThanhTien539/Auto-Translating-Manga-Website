import path from "path";
import fs from "fs/promises";
import cloudinary from "cloudinary";
import * as MangaModel from "../../models/manga.model";
import * as AuthorModel from "../../models/author.model";
import { enqueueMangaUploadJob } from "../../queues/manga-upload.queue";

const cloudinaryV2 = cloudinary.v2;

cloudinaryV2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const PROJECT_ROOT = path.resolve(__dirname, "../../");
const TMP_ZIP_DIR = path.join(PROJECT_ROOT, "storage", "tmp", "zips");

export class MangaUploadServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const normalizeStatus = (status?: string): string => {
  const value = String(status || "")
    .trim()
    .toLowerCase();
  if (value === "ongoing") return "published";
  if (value === "pending") return "pending_review";
  if (value === "completed") return "published";
  if (value === "dropped") return "rejected";
  if (value === "published") return "published";
  if (value === "rejected") return "rejected";
  if (value === "processing") return "processing";
  if (value === "draft") return "draft";
  if (value === "processing_failed") return "processing_failed";
  if (value === "pending_review") return "pending_review";
  return value || "draft";
};

const ensureTmpZipDir = async (): Promise<void> => {
  await fs.mkdir(TMP_ZIP_DIR, { recursive: true });
};

const cleanupTempFile = async (filePath?: string): Promise<void> => {
  if (!filePath) return;
  try {
    await fs.rm(filePath, { force: true });
  } catch {
    // Ignore errors during cleanup
  }
};

const uploadCoverIfNeeded = async (
  coverImagePath?: string,
): Promise<string | null> => {
  if (!coverImagePath) return null;

  const uploaded = await cloudinaryV2.uploader.upload(coverImagePath, {
    folder: "manga_covers",
    resource_type: "image",
  });

  return uploaded.secure_url;
};

export interface CreateWithFirstChapterInput {
  uploaderId: number;
  title: string;
  description?: string;
  authorId?: number;
  authorName?: string;
  originalLanguage: string;
  slug: string;
  genreIds?: number[];
  chapterNumber?: number;
  chapterTitle?: string;
  chapterZipPath: string;
  coverImagePath?: string;
}

export interface CreateChapterWithZipInput {
  uploaderId: number;
  mangaId: number;
  chapterNumber?: number;
  chapterTitle?: string;
  chapterZipPath: string;
}

export const createWithFirstChapter = async (
  input: CreateWithFirstChapterInput,
): Promise<{ mangaId: number }> => {
  try {
    await ensureTmpZipDir();

    let authorId = input.authorId;

    if (!authorId && input.authorName?.trim()) {
      const normalizedAuthorName = input.authorName.trim();
      const existedAuthor =
        await AuthorModel.getAuthorByExactName(normalizedAuthorName);

      if (existedAuthor?.author_id) {
        authorId = existedAuthor.author_id;
      } else {
        const createdAuthor = await AuthorModel.createAuthor({
          author_name: normalizedAuthorName,
        });
        authorId = createdAuthor.id;
      }
    }

    const coverImageUrl = await uploadCoverIfNeeded(input.coverImagePath);

    const manga = await MangaModel.createManga({
      title: input.title.trim(),
      description: input.description,
      author_id: authorId,
      original_language: input.originalLanguage,
      slug: input.slug.trim(),
      uploader_id: input.uploaderId,
      cover_image: coverImageUrl || undefined,
      status: "processing",
    });

    if (input.genreIds && input.genreIds.length > 0) {
      await MangaModel.createMangaGenres(
        input.genreIds.map((genreId) => ({
          manga_id: manga.id,
          genre_id: genreId,
        })),
      );
    }

    await enqueueMangaUploadJob({
      mangaId: manga.id,
      uploaderId: input.uploaderId,
      zipPath: input.chapterZipPath,
      language: input.originalLanguage,
      mode: "initial_manga_upload",
    });

    return { mangaId: manga.id };
  } catch (error: any) {
    await cleanupTempFile(input.chapterZipPath);
    throw error;
  } finally {
    await cleanupTempFile(input.coverImagePath);
  }
};

export const createChapterWithZip = async (
  input: CreateChapterWithZipInput,
): Promise<{ mangaId: number; chapterId: number }> => {
  try {
    await ensureTmpZipDir();

    const manga = await MangaModel.getMangaById(input.mangaId);
    if (!manga) {
      throw new MangaUploadServiceError(404, "Manga không tồn tại");
    }

    if (manga.uploader_id !== input.uploaderId) {
      throw new MangaUploadServiceError(403, "Bạn không có quyền thêm chapter");
    }

    let chapterNumber = input.chapterNumber;
    if (!chapterNumber || Number.isNaN(chapterNumber)) {
      const maxChapter = await MangaModel.getHighestChapterNumberByMangaId(
        input.mangaId,
      );
      chapterNumber = Math.floor(maxChapter) + 1;
    }

    const existedChapter = await MangaModel.getChapterByMangaAndNumber(
      input.mangaId,
      chapterNumber,
    );
    if (existedChapter) {
      throw new MangaUploadServiceError(409, "chapter_number đã tồn tại");
    }

    const chapter = await MangaModel.createChapter({
      manga_id: input.mangaId,
      uploader_id: input.uploaderId,
      chapter_number: chapterNumber,
      title: input.chapterTitle || `Chapter ${chapterNumber}`,
      status: "processing",
    });

    await enqueueMangaUploadJob({
      mangaId: input.mangaId,
      chapterId: chapter.id,
      uploaderId: input.uploaderId,
      zipPath: input.chapterZipPath,
      language: manga.original_language || "en",
      mode: "single_chapter_upload",
    });

    return { mangaId: input.mangaId, chapterId: chapter.id };
  } catch (error: any) {
    await cleanupTempFile(input.chapterZipPath);
    throw error;
  }
};

export const mapLegacyAdminStatus = (status: string): string => {
  return normalizeStatus(status);
};
