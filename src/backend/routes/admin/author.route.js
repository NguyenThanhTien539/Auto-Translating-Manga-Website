const express = require("express");
const route = express.Router();
const AuthorController = require("../../controllers/admin/author.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Tạo mới
route.post("/", authMiddleware.adminAuth, AuthorController.createAuthor);

// Cập nhật
route.put("/:id", authMiddleware.adminAuth, AuthorController.updateAuthor);

// Xóa
route.delete("/:id", authMiddleware.adminAuth, AuthorController.deleteAuthor);

// Lấy danh sách (hoặc tìm kiếm nếu có ?name=)
route.get("/all", AuthorController.getAllAuthors);

// Lấy chi tiết theo ID
route.get("/:id", AuthorController.getAuthorById);

// Lấy danh sách truyện của tác giả đó (API phụ trợ rất hữu ích cho Frontend)
route.get("/:id/mangas", AuthorController.getAuthorMangas);

module.exports = route;