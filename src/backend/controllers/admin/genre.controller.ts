import { Request, Response } from "express";
import * as GenreModel from "../../models/genre.model";

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    await GenreModel.insert(req.body);
    res.json({
      code: "success",
      message: "Tạo thể loại mới thành công",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Tạo thể loại mới thất bại",
    });
  }
};

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const genreList = await GenreModel.findAllGenres();
    res.json({
      code: "success",
      list: genreList,
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Có lỗi xảy ra ở đây",
    });
  }
};

export const detail = async (req: Request, res: Response): Promise<void> => {
  try {
    const genreId = req.params.id;
    const genreDetail = await GenreModel.findGenreById(Number(genreId));
    res.json({
      code: "success",
      detail: genreDetail,
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Có lỗi xảy ra ở đây",
    });
  }
};

export const edit = async (req: Request, res: Response): Promise<void> => {
  try {
    const genreId = req.params.id;
    const dataUpdate = req.body;
    await GenreModel.updateGenre(Number(genreId), dataUpdate);
    res.json({
      code: "success",
      message: "Cập nhật thể loại thành công",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Cập nhật thể loại thất bại",
    });
  }
};
