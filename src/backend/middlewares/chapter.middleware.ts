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
        message: "Chapter không tồn tại",
      });
      return;
    }

    if (chapter.status !== "Published") {
      res.status(403).json({
        code: "error",
        message: "Chapter chưa được xuất bản",
      });
      return;
    }

    const chapterPrice = parseFloat(chapter.price);

    if (chapterPrice === 0) {
      return next();
    }

    const userId = req.infoUser?.user_id || null;
    console.log("User ID from req.infoUser:", userId);

    const purchased = await db("purchased_chapters")
      .where({
        user_id: userId,
        chapter_id: chapterId,
      })
      .first();

    if (!purchased) {
      res.status(403).json({
        code: "error",
        message: "Bạn chưa mua chapter này. Vui lòng mua để tiếp tục đọc.",
        requirePurchase: true,
        chapterPrice: chapterPrice,
      });
      return;
    }
    next();
  } catch (error) {
    console.error("Chapter access check error:", error);
    res.status(500).json({
      code: "error",
      message: "Lỗi server khi kiểm tra quyền truy cập",
    });
  }
};
