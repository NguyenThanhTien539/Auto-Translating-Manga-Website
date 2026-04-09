import { Router } from "express";
import multer from "multer";
import { storage } from "../../helper/cloudinary.helper";

import * as userController from "../../controllers/client/user.controller";

const route = Router();
const upload = multer({ storage: storage });

route.patch("/", upload.single("avatar"), userController.updateProfile);

route.get("/favorite-mangas", userController.getFavoriteMangaList);

route.post("/favorite-mangas/:mangaId", userController.addFavoriteManga);

route.delete("/favorite-mangas/:mangaId", userController.removeFavoriteManga);

route.get("/favorite-mangas/:mangaId", userController.getFavoriteMangaStatus);

export default route;
