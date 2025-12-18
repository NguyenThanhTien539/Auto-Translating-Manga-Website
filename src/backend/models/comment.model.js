const db = require("../config/database.config");

module.exports.insert = async (data) => {
  return db("comments").insert(data);
};

module.exports.findByChapterId = async (chapterId) => {
  return db("comments")
    .where("chapter_id", chapterId)
    .orderBy("created_at", "desc");
};
