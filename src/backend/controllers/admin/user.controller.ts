import { Request, Response } from "express";
import * as userService from "../../services/admin/user.service";

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.listUsers();
    res.json({ code: "success", userList: users });
  } catch (error) {
    res.json({ code: "error", message: "Failed to retrieve user list" });
  }
};

export const detail = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.id;
  const infoDetail = await userService.getUserDetail(Number(userId));
  if (infoDetail) {
    res.json({ code: "success", user: infoDetail });
  } else {
    res.json({ code: "error", message: "User not found" });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.id;
  try {
    const updateData = req.body;
    await userService.updateUser(Number(userId), updateData);
    res.json({ code: "success", message: "Cập nhật thành công" });
  } catch (error) {
    res.json({ code: "error", message: "Cập nhật thất bại" });
  }
};
