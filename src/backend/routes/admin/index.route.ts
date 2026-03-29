import { Router } from "express";
import genreRoutes from "./genre.route";
import registerUploaderRoutes from "./registration-uploader.route";
import userRoutes from "./user.route";
import mangaRoutes from "./manga.route";
import authorRoutes from "./author.route";

const route = Router();

route.use("/user", userRoutes);

route.use("/genre", genreRoutes);

route.use("/uploader-registrations", registerUploaderRoutes);

route.use("/mangas", mangaRoutes);

route.use("/manage-authors", authorRoutes);

export default route;
