const db = require("../../config/database.config");
const mangaModel = require("../../models/manga.model");
module.exports.getListManga = async (req, res) => {
  try {
    const mangaList = await db("mangas")
      .join("users", "mangas.uploader_id", "users.user_id")
      .select(
        "mangas.manga_id",
        "mangas.title",
        "mangas.author_id",
        "mangas.cover_image",
        "mangas.status", // Cần đảm bảo DB có cột này hoặc thêm vào
        "mangas.created_at",
        "mangas.is_highlighted as is_approved", // Tạm dùng is_highlighted hoặc thêm cột is_approved
        "users.full_name as uploader_name"
      )
      .orderBy("mangas.created_at", "desc");

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

module.exports.updateStatusManga = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await mangaModel.updateMangaStatus(id, status);

    const chapters = await mangaModel.getChaptersByMangaId(id);
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

module.exports.updateStatusChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await mangaModel.updateChapterStatus(id, status);
    res.json({ code: "success", message: "Đã cập nhật trạng thái chương" });
  } catch (error) {
    console.error(error);
    res.json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.rejectManga = async (req, res) => {
  try {
    const { id } = req.params;
    // Ẩn truyện -> set status = 'Dropped' hoặc xóa mềm
    await db("mangas").where("manga_id", id).update({ status: "Dropped" });

    res.json({ code: "success", message: "Đã ẩn truyện" });
  } catch (error) {
    console.error(error);
    res.json({ code: "error", message: "Lỗi server" });
  }
};
