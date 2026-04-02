import { Request, Response } from "express";
import AdmZip from "adm-zip";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import crypto from "crypto";
import * as Manga from "../../models/manga.model";
import * as Coin from "../../models/coin.model";
import { AuthRequest } from "../../types";
import * as MangaService from "../../services/client/manga.service";
import * as MangaUploadService from "../../services/client/manga-upload.service";

const cloudinaryV2 = cloudinary.v2;

cloudinaryV2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const verifySignedToken = (
  pageId: number,
  token: string,
): { valid: boolean; reason?: string } => {
  try {
    const [signature, expirationTime] = token.split(":");
    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime > parseInt(expirationTime)) {
      return { valid: false, reason: "Token expired" };
    }

    const data = `${pageId}:${expirationTime}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.URL_SECRET)
      .update(data)
      .digest("hex");

    if (signature !== expectedSignature) {
      return { valid: false, reason: "Invalid signature" };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: "Invalid token format" };
  }
};

interface MulterFiles {
  cover_image?: Express.Multer.File[];
  file_content?: Express.Multer.File[];
  chapter_zip?: Express.Multer.File[];
}

const pickZipFile = (files: MulterFiles): Express.Multer.File | undefined => {
  return files.chapter_zip?.[0] || files.file_content?.[0];
};

export const createWithFirstChapter = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const files = req.files as MulterFiles;
    const zipFile = files.chapter_zip?.[0];
    const coverFile = files.cover_image?.[0];

    const genreIds = req.body.genres
      ? (() => {
          try {
            return JSON.parse(req.body.genres);
          } catch {
            return [];
          }
        })()
      : [];

    const uploaderId = req.infoUser.user_id;
    const chapterNumber = Number(req.body.chapter_number || 1);

    const created = await MangaUploadService.createWithFirstChapter({
      uploaderId,
      title: String(req.body.title).trim(),
      description: req.body.description,
      authorName: req.body.author_name,
      originalLanguage: String(req.body.language),
      slug: String(req.body.slug || "").trim(),
      genreIds: Array.isArray(genreIds) ? genreIds.map(Number) : [],
      chapterNumber:
        Number.isFinite(chapterNumber) && chapterNumber > 0 ? chapterNumber : 1,
      chapterTitle: req.body.chapter_title,
      chapterZipPath: zipFile.path,
      coverImagePath: coverFile?.path,
    });

    res.json({
      code: "success",
      success: true,
      message:
        "Đã nhận dữ liệu truyện, hệ thống đang xử lý các chapter trong ZIP",
      data: {
        mangaId: created.mangaId,
        mangaStatus: "processing",
      },
    });
  } catch (error: any) {
    if (error instanceof MangaUploadService.MangaUploadServiceError) {
      res.status(error.status).json({
        code: "error",
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      code: "error",
      success: false,
      message: "Lỗi server",
    });
  }
};

export const uploadManga = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  await createWithFirstChapter(req, res);
};

export const getMyMangas = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const uploader_id = req.infoUser!.user_id;

    const mangas = await Manga.getMangasByUploader(uploader_id);
    for (const manga of mangas) {
      const chapterCount = await Manga.countChaptersByMangaId(manga.manga_id);
      (manga as any).total_chapters = chapterCount;

      const genres = await Manga.getGenresByMangaId(manga.manga_id);
      (manga as any).genres = genres.map((g) => g.genre_name);

      const author = await Manga.getAuthorDetailByAuthorId(manga.author_id!);
      (manga as any).author_name = author ? author.author_name : "Unknown";

      const averageRating = await Manga.calculateAverageRating(manga.manga_id);
      (manga as any).average_rating = averageRating;
    }
    res.json({ code: "success", data: mangas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const getLanguages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const languages = await Manga.getAllLanguages();
    res.json({ code: "success", data: languages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const listMangas = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const pageValue = parseInt(String(req.query.page || "1"), 10);
    const limitValue = parseInt(String(req.query.limit || "12"), 10);

    const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
    const limit =
      Number.isFinite(limitValue) && limitValue > 0
        ? Math.min(limitValue, 50)
        : 12;

    const result = await MangaService.listMangas({
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách manga thành công",
      data: {
        items: result.data,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const getPublicMangaOverviewBySlug = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const slug = String(req.params.slug || "").trim();
    if (!slug) {
      res.status(400).json({ code: "error", message: "Invalid manga slug" });
      return;
    }

    const detail = await MangaService.getPublicMangaOverviewBySlug(slug);
    if (!detail) {
      res.status(404).json({ code: "error", message: "Manga not found" });
      return;
    }

    res.json({ code: "success", data: detail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Loi server" });
  }
};

export const getPublicMangaChaptersBySlug = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const slug = String(req.params.slug || "").trim();
    if (!slug) {
      res.status(400).json({ code: "error", message: "Invalid manga slug" });
      return;
    }

    const data = await MangaService.getPublicMangaChaptersBySlug(
      slug,
      req.infoUser?.user_id,
    );

    if (!data) {
      res.status(404).json({ code: "error", message: "Manga not found" });
      return;
    }

    res.json({ code: "success", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Loi server" });
  }
};

export const getChapterDetailOfClient = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const chapterId = Number(req.params.id);
    if (!Number.isFinite(chapterId)) {
      res.status(400).json({ code: "error", message: "Invalid chapter id" });
      return;
    }

    const chapter = await Manga.getChapterByChapterId(chapterId);
    if (!chapter) {
      res.status(404).json({ code: "error", message: "Chapter not found" });
      return;
    }

    res.json({ code: "success", data: { chapter } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Loi server" });
  }
};

export const getChapterPages = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const chapterId = Number(req.params.id);
    const language = req.query.language
      ? String(req.query.language)
      : undefined;

    const securePages = await MangaService.getChapterPagesForClient({
      chapterId,
      language,
      protocol: req.protocol,
      host: req.get("host") || undefined,
    });

    res.json({ code: "success", data: securePages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const getPageImage = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const pageId = Number(req.params.pageId);
    const token = req.query.token as string;

    if (!token) {
      return res.status(403).json({ code: "error", message: "Missing token" });
    }

    const verification = verifySignedToken(pageId, token);
    if (!verification.valid) {
      return res
        .status(403)
        .json({ code: "error", message: verification.reason });
    }

    const referrer = req.get("referer") || req.get("referrer");
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://54.169.111.98",
    ];

    if (!referrer) {
      return res.status(403).json({
        code: "error",
        message:
          "Direct access forbidden. This image can only be loaded from our website.",
      });
    }

    const referrerOrigin = new URL(referrer).origin;
    if (!allowedOrigins.includes(referrerOrigin)) {
      return res.status(403).json({
        code: "error",
        message: "Invalid referrer. Access denied.",
      });
    }

    const page = await Manga.getPageById(pageId);

    if (!page) {
      console.log(`Page ID ${pageId} not found in DB`);
      return res
        .status(404)
        .json({ code: "error", message: `Page ID ${pageId} not found` });
    }

    const https = require("https");
    const url = require("url");

    const parsedUrl = url.parse(page.image_url);

    https
      .get(
        {
          hostname: parsedUrl.hostname,
          path: parsedUrl.path,
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        },
        (cloudinaryRes: any) => {
          res.set(
            "Content-Type",
            cloudinaryRes.headers["content-type"] || "image/jpeg",
          );
          res.set("Cache-Control", "private, max-age=3600");
          res.set("X-Content-Type-Options", "nosniff");
          res.set("X-Frame-Options", "SAMEORIGIN");

          cloudinaryRes.pipe(res);
        },
      )
      .on("error", (err: any) => {
        console.error("Error fetching image from Cloudinary:", err);
        res.status(500).send("Error loading image");
      });
  } catch (error) {
    console.error("Error in getPageImage:", error);
    res.status(500).json({ code: "error", message: "Error loading image" });
  }
};

export const uploadChapter = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  req.params.mangaId = String(req.body.manga_id || req.params.mangaId || "");
  await createChapterWithZip(req, res);
};

export const createChapterWithZip = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const files = req.files as MulterFiles;
    const zipFile = pickZipFile(files);

    if (!zipFile) {
      res.status(400).json({
        code: "error",
        success: false,
        message: "chapter_zip là bắt buộc",
      });
      return;
    }

    const mangaId = Number(req.params.mangaId || req.body.manga_id);
    if (!Number.isFinite(mangaId) || mangaId <= 0) {
      res.status(400).json({
        code: "error",
        success: false,
        message: "mangaId không hợp lệ",
      });
      return;
    }

    const chapterNumber = req.body.chapter_number
      ? Number(req.body.chapter_number)
      : undefined;

    const created = await MangaUploadService.createChapterWithZip({
      uploaderId: req.infoUser!.user_id,
      mangaId,
      chapterNumber,
      chapterTitle: req.body.chapter_title,
      chapterZipPath: zipFile.path,
    });

    res.json({
      code: "success",
      success: true,
      message: "Đã nhận chapter mới, hệ thống đang xử lý",
      data: {
        mangaId: created.mangaId,
        chapterId: created.chapterId,
        chapterStatus: "processing",
      },
    });
  } catch (error: any) {
    if (error instanceof MangaUploadService.MangaUploadServiceError) {
      res.status(error.status).json({
        code: "error",
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Error in createChapterWithZip:", error);
    res.status(500).json({
      code: "error",
      success: false,
      message: "Lỗi server",
    });
  }
};

export const getFilterPanelData = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const values = await Manga.getFilterPanelData();
    res.json({ code: "success", data: values });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const filterMangas = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    let { chaptersMin, chaptersMax, state } = req.query;

    if (Array.isArray(state)) state = state[0] as string;

    let categories = req.query.categories;
    if (categories == null) categories = [];
    if (!Array.isArray(categories)) categories = [categories as string];
    const processedCategories = (categories as string[])
      .map((x) => String(x).trim())
      .filter(Boolean) as string[];

    const filters = {
      chaptersMin: chaptersMin !== undefined ? Number(chaptersMin) : undefined,
      chaptersMax: chaptersMax !== undefined ? Number(chaptersMax) : undefined,
      state: (state as string) ?? "all",
      categories: processedCategories,
    };

    const mangas = await Manga.filterMangas(filters);
    return res.json({ code: "success", data: mangas });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const favoriteManga = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user_id = req.infoUser!.user_id;
    const { manga_id } = req.body;
    const { type } = req.body;
    if (type === "add") {
      await Manga.addFavoriteManga(user_id, manga_id);
    } else if (type === "remove") {
      await Manga.removeFavoriteManga(user_id, manga_id);
    }
    res.json({
      code: "success",
      message: "Cập nhật danh sách yêu thích thành công",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const getFavoriteMangaList = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user_id = req.infoUser!.user_id;
    const mangas = await Manga.getFavoriteMangasByUserId(user_id);
    res.json({ code: "success", data: mangas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const checkFavoriteManga = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user_id = req.infoUser!.user_id;
    const manga_id = req.query.manga_id;
    const isFavorite = await Manga.isMangaFavoritedByUser(
      user_id,
      Number(manga_id),
    );
    res.json({ code: "success", data: isFavorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const getMangaStatistics = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user_id = req.infoUser!.user_id;
    const favoriteCount = await Manga.countFavoriteMangasByUserId(user_id);
    const { finished_count, reading_count } =
      await Manga.getFinishedAndReadingCount(user_id);

    res.json({
      code: "success",
      data: { favoriteCount, finished_count, reading_count },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
