import { Response } from "express";
import { AuthRequest } from "../../types";
import * as userControllerService from "../../services/client/user.service";

interface MulterRequest extends AuthRequest {
  file?: Express.Multer.File;
}

export const profile = async (
  req: MulterRequest,
  res: Response,
): Promise<void> => {
  const payload = { ...req.body };
  if (req.file) {
    payload.avatar = req.file.path;
  } else {
    delete payload.avatar;
  }

  try {
    const result = await userControllerService.profile(
      req.infoUser!.user_id,
      String(payload.username || ""),
      payload,
    );
    if (result.duplicateUsername) {
      res.json({ code: "error", message: "Tên đăng nhập đã tồn tại" });
      return;
    }

    res.json({ code: "success", message: "Cập nhật thông tin thành công" });
  } catch (error) {
    res.json({ code: "error", message: "Cập nhật thông tin thất bại" });
  }
};

export const registerUploader = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { reason } = req.body;
  try {
    const result = await userControllerService.registerUploader(
      req.infoUser!.user_id,
      reason,
    );
    if (result.alreadyRequested) {
      res.json({
        code: "error",
        message: "Bạn đã gửi yêu cầu trước đó. Vui lòng chờ admin duyệt.",
      });
      return;
    }

    res.json({
      code: "success",
      message: "Đăng ký thành công! Vui lòng chờ admin duyệt.",
    });
  } catch (error) {
    res.json({ code: "error", message: "Đăng ký thất bại" });
  }
};
