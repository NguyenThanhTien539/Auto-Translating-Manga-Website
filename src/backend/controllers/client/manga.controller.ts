import { Request, Response } from "express";
import AdmZip from "adm-zip";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import crypto from "crypto";
import * as Manga from "../../models/manga.model";
import * as Coin from "../../models/coin.model";
import { AuthRequest, Page } from "../../types";
import * as MangaService from "../../services/client/manga.service";

const cloudinaryV2 = cloudinary.v2;

cloudinaryV2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

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
      .createHmac("sha256", URL_SECRET)
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

const uploadFromBuffer = (buffer: Buffer): Promise<any> => {
  return new Promise((resolve, reject) => {
    let cld_upload_stream = cloudinaryV2.uploader.upload_stream(
      {
        folder: "manga_content",
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      },
    );
    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

const updateChapterCoinReward = async (
  manga_id: number,
  uploader_id: number,
): Promise<void> => {
  const UPLOAD_COIN_INTERVAL = 1;
  const UPLOAD_COIN_REWARD = 1;
  const chapterNum = await Coin.getChapterCountByMangaId(manga_id);
  if ((chapterNum + 1) % UPLOAD_COIN_INTERVAL === 0) {
    await Coin.updateCoinBalance(uploader_id, UPLOAD_COIN_REWARD);
  }
};

const processChaptersInBackground = async (
  currentMangaId: number,
  uploader_id: number,
  fileContentBuffer: Buffer,
  language: string,
): Promise<void> => {
  try {
    console.log(`Starting background processing for manga ${currentMangaId}`);

    const zip = new AdmZip(fileContentBuffer);
    const zipEntries = zip.getEntries();

    const chaptersMap = new Map<string, any[]>();

    zipEntries.forEach((entry) => {
      if (entry.isDirectory) return;
      if (!entry.entryName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return;

      const parts = entry.entryName.split("/").filter((p) => p);

      if (parts.length === 0) return;

      let chapterFolder = "Chapter 1";

      if (parts.length > 1) {
        chapterFolder = parts[parts.length - 2];
      }

      if (!chaptersMap.has(chapterFolder)) {
        chaptersMap.set(chapterFolder, []);
      }
      chaptersMap.get(chapterFolder)!.push(entry);
    });

    if (chaptersMap.size === 0) {
      const images = zipEntries.filter((e) =>
        e.entryName.match(/\.(jpg|jpeg|png|gif|webp)$/i),
      );
      if (images.length > 0) {
        chaptersMap.set("Chapter 1", images);
      }
    }

    let chapterIndex = 0;
    for (const [folderName, entries] of chaptersMap) {
      chapterIndex++;

      const numberMatch = folderName.match(/(\d+)/);
      const chapterNumber = numberMatch
        ? parseFloat(numberMatch[1])
        : chapterIndex;

      const chapterData = {
        manga_id: currentMangaId,
        uploader_id: uploader_id,
        chapter_number: chapterNumber,
        title: folderName,
      };

      const newChapter = await Manga.createChapter(chapterData);
      const chapterId = newChapter.id;

      console.log(`Chapter ${chapterNumber} created with ID:`, chapterId);

      updateChapterCoinReward(currentMangaId, uploader_id).catch((err) => {
        console.error("Error updating coin reward:", err);
      });

      const sortedEntries = entries.sort((a: any, b: any) =>
        a.entryName.localeCompare(b.entryName, undefined, { numeric: true }),
      );

      const pagesData = [];

      for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        console.log(
          `  Uploading page ${i + 1}/${sortedEntries.length}: ${entry.entryName}`,
        );

        const buffer = entry.getData();
        const uploadResult = await uploadFromBuffer(buffer);

        pagesData.push({
          chapter_id: chapterId,
          image_url: uploadResult.secure_url,
          page_number: i + 1,
          language: language || "en",
        });
      }

      if (pagesData.length > 0) {
        await Manga.createPages(pagesData);
      }
    }
  } catch (error) {
    console.error(
      `Error in background processing for manga ${currentMangaId}:`,
      error,
    );
  }
};

interface MulterFiles {
  cover_image?: Express.Multer.File[];
  file_content?: Express.Multer.File[];
}

export const uploadManga = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { title, author, description, genres, language, slug } = req.body;
    const files = req.files as MulterFiles;

    const uploader_id = req.infoUser!.user_id;

    let genreIds: number[] = [];
    if (genres) {
      try {
        genreIds = JSON.parse(genres);
      } catch (e) {
        console.error("Error parsing genres:", e);
      }
    }

    const coverUpload = await uploadFromBuffer(files.cover_image![0].buffer);

    let author_id: number | undefined;
    if (author && author.trim()) {
      const newAuthor = await Manga.createAuthor({
        author_name: author.trim(),
      });
      author_id = newAuthor.id;
    }

    const mangaData = {
      title,
      author_id: author_id,
      description,
      cover_image: coverUpload.secure_url,
      uploader_id: uploader_id,
      status: "Pending",
      original_language: language,
      slug: slug,
    };

    const newManga = await Manga.createManga(mangaData);
    const currentMangaId = newManga.id;

    if (genreIds.length > 0) {
      const mangaGenreData = genreIds.map((genreId) => ({
        manga_id: currentMangaId,
        genre_id: genreId,
      }));
      await Manga.createMangaGenres(mangaGenreData);
    }

    const fileContentBuffer = files.file_content![0].buffer;

    res.json({
      code: "success",
      message: "Manga của bạn đang được xử lý.",
    });

    processChaptersInBackground(
      currentMangaId,
      uploader_id,
      fileContentBuffer,
      language,
    ).catch((err) => {
      console.error("Background processing error:", err);
    });
  } catch (error: any) {
    console.error("Error in uploadManga:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server: " + error.message,
    });
  }
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

export const getGenres = async (req: Request, res: Response): Promise<void> => {
  try {
    const genres = await Manga.getAllGenres();
    res.json({ code: "success", data: genres });
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
    const chapterId = req.params.id;
    const { language } = req.query;

    let pages: Page[];

    if (language) {
      pages = await Manga.getChapterPagesByLanguage(
        Number(chapterId),
        String(language),
      );

      if (pages.length === 0) {
        pages = await Manga.getChapterPages(Number(chapterId));
      } else {
        const allOriginalPages = await Manga.getChapterPages(Number(chapterId));
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
      pages = await Manga.getChapterPages(Number(chapterId));
    }

    const protocol = req.protocol;
    const host = req.get("host");

    const isLocal = host?.includes("localhost") || host?.includes("127.0.0.1");
    const apiPrefix = isLocal ? "" : "/api";

    const baseUrl = `${protocol}://${host}${apiPrefix}`;

    const securePages = pages.map((page) => {
      const token = generateSignedToken(page.page_id, 3600);

      let translationStatus = "original";

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
      } else {
        translationStatus = "original";
      }

      return {
        page_id: page.page_id,
        page_number: page.page_number,
        language: page.language,
        chapter_id: page.chapter_id,
        translation_status: translationStatus,
        image_url:
          page.image_url &&
          page.image_url !== "processing" &&
          page.image_url !== ""
            ? `${baseUrl}/mangas/page-image/${page.page_id}?token=${token}`
            : null,
      };
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

const processSingleChapterInBackground = async (
  mangaId: number,
  uploader_id: number,
  fileContentBuffer: Buffer,
  language: string,
): Promise<void> => {
  try {
    console.log(
      `Starting background processing for chapter in manga ${mangaId}`,
    );

    const zip = new AdmZip(fileContentBuffer);
    const zipEntries = zip.getEntries();

    const chaptersMap = new Map<string, any[]>();

    zipEntries.forEach((entry) => {
      if (entry.isDirectory) return;
      if (!entry.entryName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return;

      const parts = entry.entryName.split("/").filter((p) => p);

      if (parts.length === 0) return;

      let chapterFolder = "Chapter 1";

      if (parts.length > 1) {
        chapterFolder = parts[parts.length - 2];
      }

      if (!chaptersMap.has(chapterFolder)) {
        chaptersMap.set(chapterFolder, []);
      }
      chaptersMap.get(chapterFolder)!.push(entry);
    });

    if (chaptersMap.size === 0) {
      const images = zipEntries.filter((e) =>
        e.entryName.match(/\.(jpg|jpeg|png|gif|webp)$/i),
      );
      if (images.length > 0) {
        chaptersMap.set("Chapter 1", images);
      }
    }

    let chapterIndex = 0;
    for (const [folderName, entries] of chaptersMap) {
      chapterIndex++;

      const numberMatch = folderName.match(/(\d+)/);
      const chapterNumber = numberMatch
        ? parseFloat(numberMatch[1])
        : chapterIndex;

      const chapterData = {
        manga_id: mangaId,
        uploader_id: uploader_id,
        chapter_number: chapterNumber,
        title: folderName,
      };

      const newChapter = await Manga.createChapter(chapterData);
      const chapterId = newChapter.id;

      console.log(`Chapter ${chapterNumber} created with ID:`, chapterId);

      const sortedEntries = entries.sort((a: any, b: any) =>
        a.entryName.localeCompare(b.entryName, undefined, { numeric: true }),
      );

      const pagesData = [];

      for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        console.log(
          `  Uploading page ${i + 1}/${sortedEntries.length}: ${entry.entryName}`,
        );

        const buffer = entry.getData();
        const uploadResult = await uploadFromBuffer(buffer);

        pagesData.push({
          chapter_id: chapterId,
          image_url: uploadResult.secure_url,
          page_number: i + 1,
          language: language || "en",
        });
      }

      if (pagesData.length > 0) {
        await Manga.createPages(pagesData);
      }
    }
  } catch (error) {
    console.error(
      `Error in background chapter processing for manga ${mangaId}:`,
      error,
    );
  }
};

export const uploadChapter = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { manga_id } = req.body;
    const files = req.files as MulterFiles;

    const uploader_id = req.infoUser!.user_id;

    const fileContentBuffer = files.file_content![0].buffer;

    res.json({
      code: "success",
      message: "Chương của bạn đang được xử lý.",
    });

    const originalLanguage = await Manga.getOriginalLanguageByMangaId(
      Number(manga_id),
    );

    processSingleChapterInBackground(
      Number(manga_id),
      uploader_id,
      fileContentBuffer,
      originalLanguage || "en",
    ).catch((err) => {
      console.error("Background chapter processing error:", err);
    });

    await updateChapterCoinReward(Number(manga_id), uploader_id);
  } catch (error: any) {
    console.error("Error in uploadChapter:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server: " + error.message,
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


