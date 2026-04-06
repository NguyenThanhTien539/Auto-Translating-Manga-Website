import { Router } from "express";
import homeRouter from "./home.route";
import accountRouter from "./account.route";
import authRouter from "./auth.route";
import userRouter from "./user.route";
import mangaRouter from "./manga.route";
import orderRouter from "./order.route";
import commentRouter from "./comment.route";
import authorRouter from "./author.route";
import readingHistoryRouter from "./reading_history.route";
import orderChapterRouter from "./order-chapter.route";
import genreRouter from "./genre.route";
import coinRouter from "./coin-package.route";
import * as authMiddleware from "../../middlewares/auth.middleware";

const clientRouter = Router();

clientRouter.use("/", homeRouter);

clientRouter.use("/coins", coinRouter);

clientRouter.use("/account", accountRouter);

clientRouter.use("/auth", authRouter);

clientRouter.use("/user", authMiddleware.clientAuth, userRouter);

clientRouter.use("/order-coin", orderRouter);

clientRouter.use("/order-chapter", orderChapterRouter);

clientRouter.use("/mangas", mangaRouter);

clientRouter.use("/comments", commentRouter);

clientRouter.use("/authors", authorRouter);

clientRouter.use("/reading-history", readingHistoryRouter);

clientRouter.use("/genres", genreRouter);

export default clientRouter;
