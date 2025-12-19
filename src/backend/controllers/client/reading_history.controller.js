const readingHistoryModel = require("../../models/reading_history.model");

module.exports.addReadingHistory = async (req, res) => {
  try {
    const { chapterId, mangaId, lastPageRead = 1 } = req.body;
    const userId = req.infoUser.user_id;
    await readingHistoryModel.addReadingHistory(
      userId,
      parseInt(chapterId),
      parseInt(mangaId),
      parseInt(lastPageRead)
    );
    res.json({ code: "success", message: "Lịch sử đọc đã được lưu" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.getReadingHistory = async (req, res) => {
  try {
    const userId = req.infoUser.user_id;
    const history = await readingHistoryModel.getReadingHistoryByUser(userId);
    res.json({ code: "success", data: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.getReadingHistoryByChapter = async (req, res) => {
  try {
    const userId = req.infoUser.user_id;
    const { chapterId } = req.params;
    const history = await readingHistoryModel.getReadingHistoryByUserAndChapter(
      userId,
      parseInt(chapterId)
    );
    res.json({ code: "success", data: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
