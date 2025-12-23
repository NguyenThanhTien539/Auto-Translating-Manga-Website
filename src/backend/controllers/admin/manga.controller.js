const db = require("../../config/database.config");
const mangaModel = require("../../models/manga.model");
const accountModel = require("../../models/account.model");
const crypto = require("crypto");

module.exports.getListManga = async (req, res) => {
  try {
    const mangaList = await mangaModel.getAllMangas();
    for (const manga of mangaList) {
      const uploader = await accountModel.getUserById(manga.uploader_id);
      manga.uploader_name = uploader.username;

      const author = await mangaModel.getAuthorDetailByAuthorId(
        manga.author_id
      );
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
    const { status, coin_price } = req.body;
    await mangaModel.updateChapterStatus(id, status, coin_price);
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
    const author = await mangaModel.getAuthorDetailByAuthorId(manga.author_id);
    manga.author_name = author ? author.author_name : "N/A";
    const genres = await mangaModel.getGenresByMangaId(mangaId);
    manga.genres = genres.map((g) => g.genre_name);

    const averageRating = await mangaModel.calculateAverageRating(mangaId);
    manga.average_rating = averageRating;

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

const URL_SECRET = process.env.URL_SECRET || "your-secret-key-change-this";

const generateSignedToken = (pageId, expiresIn = 3600) => {
  const expirationTime = Math.floor(Date.now() / 1000) + expiresIn; // 1 hour default
  const data = `${pageId}:${expirationTime}`;
  const signature = crypto
    .createHmac("sha256", URL_SECRET)
    .update(data)
    .digest("hex");
  return `${signature}:${expirationTime}`;
};
module.exports.getChapterPages = async (req, res) => {
  try {
    const chapterId = req.params.id;
    const pages = await mangaModel.getChapterPages(chapterId);
    // Get base URL from request or use default
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;

    // Return proxy URLs with signed tokens (expires in 1 hour)
    const securePages = pages.map((page) => {
      const token = generateSignedToken(page.page_id, 3600); // 1 hour
      return {
        page_id: page.page_id,
        page_number: page.page_number,
        language: page.language,
        chapter_id: page.chapter_id,
        image_url: `${baseUrl}/manga/page-image/${page.page_id}?token=${token}`,
      };
    });

    res.json({ code: "success", data: securePages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};

module.exports.setHighlightManga = async (req, res) => {
  try {
    const { id } = req.params;
    let { is_highlight, highlight_duration } = req.body;

    is_highlight = is_highlight === true || is_highlight === "true";
    highlight_duration = Number(highlight_duration) || 0;

    const dataToUpdate = {
      is_highlighted: is_highlight,
      highlight_end_at: null,
    };

    if (is_highlight) {
      const days = highlight_duration > 0 ? highlight_duration : 7;
      dataToUpdate.highlight_end_at = new Date(Date.now() + days * 86400000);
    }

    await mangaModel.setHighlightManga(id, dataToUpdate);

    return res.json({
      code: "success",
      message: is_highlight
        ? "Đã cập nhật trạng thái nổi bật của truyện"
        : "Đã gỡ bỏ trạng thái nổi bật của truyện",
    });
  } catch (error) {
    console.error(error);
    return res.json({ code: "error", message: "Lỗi server" });
  }
};
