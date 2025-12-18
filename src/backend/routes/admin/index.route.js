const route = require("express").Router();
const genreRoutes = require("./genre.route");
const registerUploaderRoutes = require("./registration-uploader.route");
const userRoutes = require("./user.route");
const mangaRoutes = require("./manga.route");

route.use("/user", userRoutes);

route.use("/genre", genreRoutes);

route.use("/registration-uploader", registerUploaderRoutes);

route.use("/manage-manga", mangaRoutes);

module.exports = route;
