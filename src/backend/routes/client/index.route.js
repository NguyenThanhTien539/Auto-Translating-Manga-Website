const route = require("express").Router();
const homeRoute = require("./home.route");
const accountRoute = require("./account.route");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const mangaRoute = require("./manga.route");
const orderRoute = require("./order.route");
const commentRoute = require("./comment.route");
const authorRoute = require("./author.route");
const readingHistoryRoute = require("./reading_history.route");
const orderChapterRoute = require("./order-chapter.route");
const authMiddleware = require("../../middlewares/auth.middleware");

route.use("/", homeRoute);

route.use("/account", accountRoute);

route.use("/auth", authRoute);

route.use("/user", authMiddleware.clientAuth, userRoute);

route.use("/order-coin", orderRoute);

route.use("/order-chapter", orderChapterRoute);

route.use("/manga", mangaRoute);

route.use("/comments", commentRoute);

route.use("/authors", authorRoute);

route.use("/reading-history", readingHistoryRoute);

module.exports = route;
