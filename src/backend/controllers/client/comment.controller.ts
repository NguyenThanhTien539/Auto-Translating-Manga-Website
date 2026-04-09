import { Response } from "express";
import { AuthRequest } from "../../types";
import * as commentControllerService from "../../services/client/comment.service";
import * as mangaModel from "../../models/manga.model";

const isChapterBelongToManga = async (
  mangaParam: string,
  chapterId: number,
): Promise<boolean> => {
  const chapter = await mangaModel.getChapterByChapterId(chapterId);
  if (!chapter) {
    return false;
  }

  if (/^\d+$/.test(mangaParam)) {
    return chapter.manga_id === Number(mangaParam);
  }

  const mangaBySlug = await mangaModel.getMangaBySlug(mangaParam);
  return !!mangaBySlug && mangaBySlug.manga_id === chapter.manga_id;
};

export const add = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chapter_id = req.query.chapter_id;
    const user_id = req.infoUser!.user_id;
    await commentControllerService.add({
      ...req.body,
      chapter_id,
      user_id,
    });
    res.json({ code: "success", message: "Bạn đã thêm bình luận thành công" });
  } catch (error) {
    console.error("Error adding comment:", error);
    res
      .status(500)
      .json({ code: "error", message: "Đã xảy ra lỗi khi thêm bình luận" });
  }
};

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chapter_id = req.query.chapter_id;
    const comments = await commentControllerService.list(Number(chapter_id));
    res.json({ code: "success", data: comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res
      .status(500)
      .json({ code: "error", message: "Đã xảy ra lỗi khi lấy bình luận" });
  }
};

export const listByMangaChapter = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const mangaParam = String(req.params.mangaId || "").trim();
    const chapterId = Number(req.params.chapterId);

    if (!mangaParam || !Number.isFinite(chapterId) || chapterId <= 0) {
      res.status(400).json({ code: "error", message: "Tham số không hợp lệ" });
      return;
    }

    const matched = await isChapterBelongToManga(mangaParam, chapterId);
    if (!matched) {
      res
        .status(404)
        .json({ code: "error", message: "Không tìm thấy chapter thuộc manga" });
      return;
    }

    const comments = await commentControllerService.list(chapterId);
    res.json({ code: "success", data: comments });
  } catch (error) {
    console.error("Error fetching comments by manga/chapter:", error);
    res
      .status(500)
      .json({ code: "error", message: "Đã xảy ra lỗi khi lấy bình luận" });
  }
};

export const addByMangaChapter = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const mangaParam = String(req.params.mangaId || "").trim();
    const chapterId = Number(req.params.chapterId);
    const user_id = req.infoUser!.user_id;

    if (!mangaParam || !Number.isFinite(chapterId) || chapterId <= 0) {
      res.status(400).json({ code: "error", message: "Tham số không hợp lệ" });
      return;
    }

    const matched = await isChapterBelongToManga(mangaParam, chapterId);
    if (!matched) {
      res
        .status(404)
        .json({ code: "error", message: "Không tìm thấy chapter thuộc manga" });
      return;
    }

    await commentControllerService.add({
      ...req.body,
      chapter_id: chapterId,
      user_id,
    });

    res.json({ code: "success", message: "Bạn đã thêm bình luận thành công" });
  } catch (error) {
    console.error("Error adding comment by manga/chapter:", error);
    res
      .status(500)
      .json({ code: "error", message: "Đã xảy ra lỗi khi thêm bình luận" });
  }
};
