import { Router } from "express";
import * as homeController from "../../controllers/client/home.controller";

const route = Router();

route.get("/search", homeController.getSearchResults);

export default route;
