import { Response, NextFunction } from "express";
import db from "../config/database.config";
import { AuthRequest } from "../types";

export const checkChapterAccessOptional = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const chapterId = req.params.id;
    const chapter = await db("chapters").where("chapter_id", chapterId).first();

    if (!chapter) {
      res.status(404).json({
        code: "error",
        message: "Chapter khong ton tai",
      });
      return;
    }

    const normalizedChapterStatus = String(chapter.status || "")
      .trim()
      .toLowerCase();

    if (
      normalizedChapterStatus !== "published" &&
      normalizedChapterStatus !== "approved"
    ) {
      res.status(403).json({
        code: "error",
        message: "Chapter chua duoc xuat ban",
        chapter_status: chapter.status ?? null,
        chapter_id: chapterId,
      });
      return;
    }

    const chapterPrice = parseFloat(chapter.price);

    if (chapterPrice === 0) {
      next();
      return;
    }

    const userId = req.infoUser?.user_id || null;

    const purchased = await db("purchased_chapters")
      .where({
        user_id: userId,
        chapter_id: chapterId,
      })
      .first();

    if (!purchased) {
      res.status(403).json({
        code: "error",
        message: "Ban chua mua chapter nay. Vui long mua de tiep tuc doc.",
        requirePurchase: true,
        chapterPrice,
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Chapter access check error:", error);
    res.status(500).json({
      code: "error",
      message: "Loi server khi kiem tra quyen truy cap",
    });
  }
};
