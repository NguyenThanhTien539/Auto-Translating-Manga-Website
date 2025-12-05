const route = require("express").Router();
const genreRoutes = require("./genre.route");
const registerUploaderRoutes = require("./registration-uploader.route");

route.use("/genre", genreRoutes);

route.use("/registration-uploader", registerUploaderRoutes);

module.exports = route;
