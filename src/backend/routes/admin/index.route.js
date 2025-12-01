const route = require("express").Router();
const genreRoutes = require("./genre.route");
route.use("/genre", genreRoutes);

module.exports = route;
