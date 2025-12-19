const AuthorModel = require("../../models/author.model");

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