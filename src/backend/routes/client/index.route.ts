import { Router } from "express";
import homeRouter from "./home.route";
import accountRouter from "./account.route";
import authRouter from "./auth.route";
import userRouter from "./user.route";
import mangaRouter from "./manga.route";
import orderRouter from "./order.route";
import authorRouter from "./author.route";
import readingHistoryRouter from "./reading_history.route";
import orderChapterRouter from "./order-chapter.route";
import genreRouter from "./genre.route";
import coinRouter from "./coin-package.route";
import * as authMiddleware from "../../middlewares/auth.middleware";
import * as userController from "../../controllers/client/user.controller";

const clientRouter = Router();

clientRouter.use("/", homeRouter);

clientRouter.use("/coins", coinRouter);

clientRouter.use("/account", accountRouter);

clientRouter.use("/auth", authRouter);

clientRouter.use("/users/me", authMiddleware.clientAuth, userRouter);

clientRouter.use("/order-coin", orderRouter);

clientRouter.use("/order-chapter", orderChapterRouter);

clientRouter.use("/mangas", mangaRouter);

clientRouter.use("/authors", authorRouter);

clientRouter.use("/reading-history", readingHistoryRouter);

clientRouter.use("/genres", genreRouter);

clientRouter.post(
  "/uploader-requests",
  authMiddleware.clientAuth,
  userController.createUploaderRequest,
);

export default clientRouter;
