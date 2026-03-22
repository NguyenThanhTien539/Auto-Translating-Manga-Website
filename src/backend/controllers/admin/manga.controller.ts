import { Request, Response } from "express";
import db from "../../config/database.config";
import * as mangaModel from "../../models/manga.model";
import * as accountModel from "../../models/account.model";
import crypto from "crypto";

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

export const getListManga = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const mangaList = await mangaModel.getAllMangas();
    for (const manga of mangaList) {
      const uploader = await accountModel.getUserById(manga.uploader_id!);
      (manga as any).uploader_name = uploader?.username;

      const author = await mangaModel.getAuthorDetailByAuthorId(
        manga.author_id!,
      );
      (manga as any).author = author ? author.author_name : "N/A";
    }
    res.json({
      code: "success",
      mangaList: mangaList,
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Lỗi server",
    });
  }
};

export const updateStatusManga = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await mangaModel.updateMangaStatus(Number(id), status);

    const chapters = await mangaModel.getChaptersByMangaId(Number(id));
    if (status === "OnGoing") {
      for (const chapter of chapters) {
        await mangaModel.updateChapterStatus(chapter.chapter_id, "Published");
      }
    }

    if (status === "Rejected") {
      for (const chapter of chapters) {
        await mangaModel.updateChapterStatus(chapter.chapter_id, "Rejected");
      }
    }

    res.json({ code: "success", message: "Đã duyệt truyện" });
  } catch (error) {
    console.error(error);
    res.json({ code: "error", message: "Lỗi server" });
  }
};

export const updateStatusChapter = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, coin_price } = req.body;
    await mangaModel.updateChapterStatus(Number(id), status, coin_price);
    res.json({ code: "success", message: "Đã cập nhật trạng thái chương" });
  } catch (error) {
    console.error(error);
    res.json({ code: "error", message: "Lỗi server" });
  }
};

export const rejectManga = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    await db("mangas").where("manga_id", id).update({ status: "Dropped" });

    res.json({ code: "success", message: "Đã ẩn truyện" });
  } catch (error) {
    console.error(error);
    res.json({ code: "error", message: "Lỗi server" });
  }
};

export const getMangaDetail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const mangaId = req.params.id;
    const manga = await mangaModel.getMangaById(Number(mangaId));
    if (!manga) {
      res.status(404).json({ code: "error", message: "Manga not found" });
      return;
    }
    const author = await mangaModel.getAuthorDetailByAuthorId(manga.author_id!);
    (manga as any).author_name = author ? author.author_name : "N/A";
    const genres = await mangaModel.getGenresByMangaId(Number(mangaId));
    (manga as any).genres = genres.map((g) => g.genre_name);

    const averageRating = await mangaModel.calculateAverageRating(
      Number(mangaId),
    );
    (manga as any).average_rating = averageRating;

    const chapters = await mangaModel.getChaptersByMangaId(Number(mangaId));
    const totalChaper = await mangaModel.countChaptersByMangaId(
      Number(mangaId),
    );
    (manga as any).totalChapters = totalChaper;
    const finalDetail = { manga, chapters };
    res.json({ code: "success", data: finalDetail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const getChapterPages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const chapterId = req.params.id;
    const pages = await mangaModel.getChapterPages(Number(chapterId));
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;

    const securePages = pages.map((page) => {
      const token = generateSignedToken(page.page_id, 3600);
      return {
        page_id: page.page_id,
        page_number: page.page_number,
        language: page.language,
        chapter_id: page.chapter_id,
        image_url: `${baseUrl}/manga/page-image/${page.page_id}?token=${token}`,
      };
    });

    res.json({ code: "success", data: securePages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const setHighlightManga = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    let { is_highlight, highlight_duration } = req.body;

    is_highlight = is_highlight === true || is_highlight === "true";
    highlight_duration = Number(highlight_duration) || 0;

    const dataToUpdate: {
      is_highlighted: boolean;
      highlight_end_at: Date | null;
    } = {
      is_highlighted: is_highlight,
      highlight_end_at: null,
    };

    if (is_highlight) {
      const days = highlight_duration > 0 ? highlight_duration : 7;
      dataToUpdate.highlight_end_at = new Date(Date.now() + days * 86400000);
    }

    await mangaModel.setHighlightManga(Number(id), dataToUpdate);

    return res.json({
      code: "success",
      message: is_highlight
        ? "Đã cập nhật trạng thái nổi bật của truyện"
        : "Đã gỡ bỏ trạng thái nổi bật của truyện",
    });
  } catch (error) {
    console.error(error);
    return res.json({ code: "error", message: "Lỗi server" });
  }
};
