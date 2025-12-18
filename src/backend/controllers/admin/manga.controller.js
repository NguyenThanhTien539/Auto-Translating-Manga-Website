const db = require("../../config/database.config");
const mangaModel = require("../../models/manga.model");
const accountModel = require("../../models/account.model");

module.exports.getListManga = async (req, res) => {
  try {
    const mangaList = await mangaModel.getAllMangas();
    for (const manga of mangaList) {
      const uploader = await accountModel.getUserById(manga.uploader_id);
      manga.uploader_name = uploader.username;

      const author = await mangaModel.getAuthorDetailByAuthorId(manga.author_id);
      manga.author = author ? author.author_name : "N/A";
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

module.exports.getMangaDetail = async (req, res) => {
  try {
    const mangaId = req.params.id;
    const manga = await mangaModel.getMangaById(mangaId);
    const genres = await mangaModel.getGenresByMangaId(mangaId);
    manga.genres = genres.map((g) => g.genre_name);

    const chapters = await mangaModel.getChaptersByMangaId(mangaId);
    const totalChaper = await mangaModel.countChaptersByMangaId(mangaId);
    manga.totalChapters = totalChaper;
    const finalDetail = { manga, chapters };
    res.json({ code: "success", data: finalDetail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
