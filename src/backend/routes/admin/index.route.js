const route = require("express").Router();
const genreRoutes = require("./genre.route");
const registerUploaderRoutes = require("./registration-uploader.route");
const userRoutes = require("./user.route");

route.use("/user", userRoutes);

route.use("/genre", genreRoutes);

route.use("/registration-uploader", registerUploaderRoutes);

module.exports = route;
