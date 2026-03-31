import * as readingHistoryModel from "../../models/reading_history.model";

export const addReadingHistory = async (
  userId: number,
  chapterId: number,
  mangaId: number,
  lastPageRead: number,
): Promise<void> => {
  await readingHistoryModel.addReadingHistory(
    userId,
    chapterId,
    mangaId,
    lastPageRead,
  );
};

export const getReadingHistory = async (userId: number): Promise<any> => {
  return readingHistoryModel.getReadingHistoryByUser(userId);
};

export const getReadingHistoryByChapter = async (
  userId: number,
  chapterId: number,
): Promise<any> => {
  return readingHistoryModel.getReadingHistoryByUserAndChapter(
    userId,
    chapterId,
  );
};
