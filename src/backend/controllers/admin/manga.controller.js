const db = require("../../config/database.config");

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

module.exports.approveManga = async (req, res) => {
    try {
        const { id } = req.params;
        // Giả sử duyệt là set status = 'OnGoing' hoặc is_highlighted = true
        // Tùy vào logic DB của bạn. Ở đây tôi set status = 'OnGoing'
        await db("mangas").where("manga_id", id).update({ status: "OnGoing" });
        
        res.json({ code: "success", message: "Đã duyệt truyện" });
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
