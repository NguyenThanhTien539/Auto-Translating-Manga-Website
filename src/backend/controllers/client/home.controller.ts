import { Request, Response } from "express";
import * as homeControllerService from "../../services/client/home.service";

export const home = async (req: Request, res: Response): Promise<void> => {
  res.send("Thanh Tien ne");
};

export const getSearchResults = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const keyword = (req.query.keyword ?? "").toString().trim();
    if (!keyword) return res.json({ code: "success", data: [] });

    const mangasWithRating =
      await homeControllerService.getSearchResults(keyword);

    return res.json({ code: "success", data: mangasWithRating });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
