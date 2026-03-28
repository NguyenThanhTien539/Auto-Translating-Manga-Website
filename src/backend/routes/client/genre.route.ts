import { Router } from "express";
import * as GenreModel from "../../models/genre.model";

const route = Router();

route.get("/", async (req, res) => {
  const genres = await GenreModel.findAllGenres();
  res.status(200).json({
    success: true,
    message: "Lấy danh sách thể loại thành công",
    data: genres,
  });
});

export default route;
