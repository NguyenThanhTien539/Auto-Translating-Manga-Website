import { Response } from "express";
import * as readingHistoryModel from "../../models/reading_history.model";
import { AuthRequest } from "../../types";

export const addReadingHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chapterId, mangaId, lastPageRead = 1 } = req.body;
    const userId = req.infoUser!.user_id;
    await readingHistoryModel.addReadingHistory(
      userId,
      parseInt(chapterId),
      parseInt(mangaId),
      parseInt(lastPageRead),
    );
    res.json({ code: "success", message: "Lịch sử đọc đã được lưu" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const getReadingHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.infoUser!.user_id;
    const history = await readingHistoryModel.getReadingHistoryByUser(userId);
    res.json({ code: "success", data: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

export const getReadingHistoryByChapter = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.infoUser!.user_id;
    const { chapterId } = req.params;
    const history = await readingHistoryModel.getReadingHistoryByUserAndChapter(
      userId,
      parseInt(chapterId as string),
    );
    res.json({ code: "success", data: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
