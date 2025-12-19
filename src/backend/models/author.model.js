const db = require("../config/database.config");

/**
 * Cấu trúc bảng authors:
 * - author_id (int4, Primary Key)
 * - author_name (varchar)
 * - biography (text)
 * - avatar_url (text)
 */

// Tạo tác giả mới
module.exports.createAuthor = async (data) => {
  const [id] = await db("authors").insert(data).returning("author_id");
  // Xử lý kết quả trả về để đảm bảo lấy đúng ID (hỗ trợ cả mảng object hoặc giá trị đơn)
  return { id: typeof id === "object" ? id.author_id : id };
};

// Lấy thông tin chi tiết một tác giả theo ID
module.exports.getAuthorById = async (authorId) => {
  return db("authors")
    .where("author_id", authorId)
    .first();
};

// Lấy danh sách tất cả tác giả
module.exports.getAllAuthors = async () => {
  return db("authors")
    .select("*")
    .orderBy("author_name", "asc");
};

// Cập nhật thông tin tác giả
module.exports.updateAuthor = async (authorId, data) => {
  return db("authors")
    .where("author_id", authorId)
    .update(data);
};

// Xóa tác giả
module.exports.deleteAuthor = async (authorId) => {
  return db("authors")
    .where("author_id", authorId)
    .del();
};

// Tìm kiếm tác giả theo tên (hỗ trợ tính năng Search)
module.exports.searchAuthorsByName = async (name) => {
  return db("authors")
    .where("author_name", "ilike", `%${name}%`) // "ilike" để tìm kiếm không phân biệt hoa thường trong Postgres
    .select("*");
};

// Lấy danh sách manga của một tác giả cụ thể 
// (Giả sử bạn có bảng mangas với cột author_id)
module.exports.getMangasByAuthorId = async (authorId) => {
  return db("mangas")
    .where("author_id", authorId)
    .select("manga_id", "title", "coverUrl");
};

// Hàm bổ trợ để lấy chi tiết (alias cho getAuthorById giống ví dụ của bạn)
module.exports.getAuthorDetailByAuthorId = async (authorId) => {
  return db("authors")
    .where("author_id", authorId)
    .first();
};