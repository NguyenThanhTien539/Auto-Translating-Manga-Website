const route = require("express").Router();
const homeRoute = require("./home.route");
const accountRoute = require("./account.route");
const authRoute = require("./auth.route");
const mangaRoute = require("./manga.route");

route.use("/", homeRoute);

route.use("/account", accountRoute);

route.use("/auth", authRoute);

route.use('/manga', mangaRoute);

module.exports = route;
