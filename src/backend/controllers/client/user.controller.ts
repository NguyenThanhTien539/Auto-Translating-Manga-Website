import { Response } from "express";
import * as accountModel from "../../models/account.model";
import * as uploaderRequestModel from "../../models/registration-uploader";
import { AuthRequest } from "../../types";

interface MulterRequest extends AuthRequest {
  file?: Express.Multer.File;
}

export const profile = async (
  req: MulterRequest,
  res: Response,
): Promise<void> => {
  if (req.file) {
    req.body.avatar = req.file.path;
  } else {
    delete req.body.avatar;
  }

  const existingUser = await accountModel.checkUsernameExists(
    req.body.username,
  );
  if (existingUser && existingUser.user_id !== req.infoUser!.user_id) {
    res.json({ code: "error", message: "Tên đăng nhập đã tồn tại" });
    return;
  }

  try {
    await accountModel.updateProfile(req.infoUser!.user_id, req.body);
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
    if (
      await uploaderRequestModel.checkExistingRequest(req.infoUser!.user_id)
    ) {
      res.json({
        code: "error",
        message: "Bạn đã gửi yêu cầu trước đó. Vui lòng chờ admin duyệt.",
      });
      return;
    }

    await uploaderRequestModel.insertReason(req.infoUser!.user_id, reason);
    res.json({
      code: "success",
      message: "Đăng ký thành công! Vui lòng chờ admin duyệt.",
    });
  } catch (error) {
    res.json({ code: "error", message: "Đăng ký thất bại" });
  }
};
