import { Response } from "express";
import { AuthRequest } from "../../types";
import * as readingHistoryControllerService from "../../services/client/reading_history.service";

export const addReadingHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chapterId, mangaId, lastPageRead = 1 } = req.body;
    const userId = req.infoUser!.user_id;
    await readingHistoryControllerService.addReadingHistory(
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
    const history =
      await readingHistoryControllerService.getReadingHistory(userId);
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
    const history =
      await readingHistoryControllerService.getReadingHistoryByChapter(
        userId,
        parseInt(chapterId as string),
      );
    res.json({ code: "success", data: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
