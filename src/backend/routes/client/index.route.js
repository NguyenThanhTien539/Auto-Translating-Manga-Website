const route = require("express").Router();
const homeRoute = require("./home.route");
const accountRoute = require("./account.route");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const mangaRoute = require("./manga.route");
const orderRoute = require("./order.route");
const commentRoute = require("./comment.route");

route.use("/", homeRoute);

route.use("/account", accountRoute);

route.use("/auth", authRoute);

route.use("/user", userRoute);

route.use("/order-coin", orderRoute);

route.use("/manga", mangaRoute);

route.use("/comments", commentRoute);

module.exports = route;
