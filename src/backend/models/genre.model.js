const db = require("../config/database.config");

module.exports.insert = async (data) => {
  return db("genres").insert(data);
};
module.exports.findAllGenre = async () => {
  return db("genres").select("*").orderBy("genre_id", "asc");
};

module.exports.findGenreById = async (genreId) => {
  return db("genres").where("genre_id", genreId).first();
};

module.exports.updateGenre = async (genreId, dataUpdate) => {
  return db("genres").where("genre_id", genreId).update(dataUpdate);
};
