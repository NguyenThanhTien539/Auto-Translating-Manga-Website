const express = require("express");
const router = express.Router();
const AuthorController = require("../../controllers/client/author.controller");

// Định nghĩa các route

// Lấy danh sách (hoặc tìm kiếm nếu có ?name=)
router.get("/all", AuthorController.getAllAuthors);

// Lấy chi tiết theo ID
router.get("/:id", AuthorController.getAuthorById);

// Lấy danh sách truyện của tác giả đó (API phụ trợ rất hữu ích cho Frontend)
router.get("/:id/mangas", AuthorController.getAuthorMangas);

module.exports = router;