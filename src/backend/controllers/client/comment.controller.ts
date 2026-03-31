import { Response } from "express";
import { AuthRequest } from "../../types";
import * as commentControllerService from "../../services/client/comment.service";

export const add = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chapter_id = req.query.chapter_id;
    const user_id = req.infoUser!.user_id;
    await commentControllerService.add({
      ...req.body,
      chapter_id,
      user_id,
    });
    res.json({ code: "success", message: "Bạn đã thêm bình luận thành công" });
  } catch (error) {
    console.error("Error adding comment:", error);
    res
      .status(500)
      .json({ code: "error", message: "Đã xảy ra lỗi khi thêm bình luận" });
  }
};

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chapter_id = req.query.chapter_id;
    const comments = await commentControllerService.list(Number(chapter_id));
    res.json({ code: "success", data: comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res
      .status(500)
      .json({ code: "error", message: "Đã xảy ra lỗi khi lấy bình luận" });
  }
};
