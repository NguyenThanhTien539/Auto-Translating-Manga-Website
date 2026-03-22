import { Response } from "express";
import * as commentModel from "../../models/comment.model";
import * as accountModel from "../../models/account.model";
import { AuthRequest } from "../../types";

export const add = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chapter_id = req.query.chapter_id;
    const user_id = req.infoUser!.user_id;
    req.body.chapter_id = chapter_id;
    req.body.user_id = user_id;
    await commentModel.insert(req.body);
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
    const comments = await commentModel.findByChapterId(Number(chapter_id));
    for (const comment of comments) {
      const user = await accountModel.getUserById(comment.user_id);
      comment.user_name = user ? user.username : "Unknown";
      comment.avatar = user ? user.avatar : undefined;
    }
    res.json({ code: "success", data: comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res
      .status(500)
      .json({ code: "error", message: "Đã xảy ra lỗi khi lấy bình luận" });
  }
};
