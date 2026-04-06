import { Router } from "express";
import homeRoute from "./home.route";
import accountRoute from "./account.route";
import authRoute from "./auth.route";
import userRoute from "./user.route";
import mangaRoute from "./manga.route";
import orderRoute from "./order.route";
import commentRoute from "./comment.route";
import authorRoute from "./author.route";
import readingHistoryRoute from "./reading_history.route";
import orderChapterRoute from "./order-chapter.route";
import genreRoute from "./genre.route";
import coinRoute from "./coin-package.route";
import * as authMiddleware from "../../middlewares/auth.middleware";

const route = Router();

route.use("/", homeRoute);

route.use("/coins", coinRoute);

route.use("/account", accountRoute);

route.use("/auth", authRoute);

route.use("/user", authMiddleware.clientAuth, userRoute);

route.use("/order-coin", orderRoute);

route.use("/order-chapter", orderChapterRoute);

route.use("/mangas", mangaRoute);

route.use("/comments", commentRoute);

route.use("/authors", authorRoute);

route.use("/reading-history", readingHistoryRoute);

route.use("/genres", genreRoute);

export default route;
