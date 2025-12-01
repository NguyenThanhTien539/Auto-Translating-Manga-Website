const db = require("../config/database.config");

module.exports.insert = async (data) => {
  return db("genre").insert(data);
};
