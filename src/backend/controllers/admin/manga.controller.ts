import { Request, Response } from "express";
import * as mangaService from "../../services/admin/manga.service";

export const getListManga = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const mangaList = await mangaService.getListManga();
    res.json({
      code: "success",
      mangaList,
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
    const { status, review_note } = req.body;
    await mangaService.updateMangaStatus(Number(id), status, review_note);

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
    const { status, coin_price, review_note } = req.body;
    await mangaService.updateChapterStatus(
      Number(id),
      status,
      coin_price,
      review_note,
    );
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
    await mangaService.rejectManga(Number(id));

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
    const mangaId = Number(req.params.id);
    const mangaDetail = await mangaService.getMangaDetail(mangaId);
    if (!mangaDetail) {
      res.status(404).json({ code: "error", message: "Manga not found" });
      return;
    }

    res.json({ code: "success", data: mangaDetail });
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
    const chapterId = Number(req.params.id);
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;

    const securePages = await mangaService.getChapterPages(chapterId, baseUrl);

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
    const { is_highlight, highlight_duration } = req.body;

    const result = await mangaService.setHighlightManga(
      Number(id),
      is_highlight,
      highlight_duration,
    );

    return res.json({
      code: "success",
      message: result.is_highlight
        ? "Đã cập nhật trạng thái nổi bật của truyện"
        : "Đã gỡ bỏ trạng thái nổi bật của truyện",
    });
  } catch (error) {
    console.error(error);
    return res.json({ code: "error", message: "Lỗi server" });
  }
};
