const AuthorModel = require("../../models/author.model");

// [POST] /authors - Tạo tác giả mới
module.exports.createAuthor = async (req, res) => {
  try {
    const { author_name, biography, avatar_url } = req.body;

    // Validate cơ bản
    if (!author_name) {
      return res.status(400).json({ message: "Author name is required" });
    }

    const result = await AuthorModel.createAuthor({
      author_name,
      biography,
      avatar_url,
    });

    return res.status(201).json({
      message: "Author created successfully",
      authorId: result.id,
    });
  } catch (error) {
    console.error("Error creating author:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// [PUT] /authors/:id - Cập nhật thông tin
module.exports.updateAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body; // { author_name, biography, avatar_url }

    // Kiểm tra tác giả có tồn tại không
    const existingAuthor = await AuthorModel.getAuthorById(id);
    if (!existingAuthor) {
      return res.status(404).json({ message: "Author not found" });
    }

    await AuthorModel.updateAuthor(id, data);

    return res.status(200).json({ message: "Author updated successfully" });
  } catch (error) {
    console.error("Error updating author:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// [DELETE] /authors/:id - Xóa tác giả
module.exports.deleteAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Logic kiểm tra: Nếu tác giả đã có truyện (manga), có thể chặn không cho xóa
    // hoặc xóa mềm (soft delete). Ở đây làm xóa cứng đơn giản:
    
    const count = await AuthorModel.deleteAuthor(id);
    
    if (count === 0) {
        return res.status(404).json({ message: "Author not found to delete" });
    }

    return res.status(200).json({ message: "Author deleted successfully" });
  } catch (error) {
    console.error("Error deleting author:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// [GET] /authors - Lấy danh sách tác giả (có hỗ trợ search ?name=...)
module.exports.getAllAuthors = async (req, res) => {
  try {
    const { name } = req.query;
    let authors;

    if (name) {
      // Nếu có query param ?name=... thì tìm kiếm
      authors = await AuthorModel.searchAuthorsByName(name);
    } else {
      // Không thì lấy tất cả
      authors = await AuthorModel.getAllAuthors();
    }

    return res.status(200).json(authors);
  } catch (error) {
    console.error("Error getting authors:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// [GET] /authors/:id - Lấy chi tiết tác giả
module.exports.getAuthorById = async (req, res) => {
  try {
    const { id } = req.params;
    const author = await AuthorModel.getAuthorById(id);

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    return res.status(200).json(author);
  } catch (error) {
    console.error("Error getting author details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// [GET] /authors/:id/mangas - Lấy các truyện của tác giả này
module.exports.getAuthorMangas = async (req, res) => {
    try {
        const { id } = req.params;
        const mangas = await AuthorModel.getMangasByAuthorId(id);
        return res.status(200).json(mangas);
    } catch (error) {
        console.error("Error getting author mangas:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}