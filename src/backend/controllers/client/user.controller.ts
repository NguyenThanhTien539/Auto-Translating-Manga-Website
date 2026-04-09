import { Response } from "express";
import { AuthRequest } from "../../types";
import * as userControllerService from "../../services/client/user.service";

interface MulterRequest extends AuthRequest {
  file?: Express.Multer.File;
}

export const updateProfile = async (
  req: MulterRequest,
  res: Response,
): Promise<void> => {
  const payload = { ...req.body };

  if (req.file) {
    const uploadedFile = req.file as Express.Multer.File & {
      secure_url?: string;
      url?: string;
      path?: string;
    };

    payload.avatar =
      uploadedFile.secure_url || uploadedFile.url || uploadedFile.path;

    if (!payload.avatar) {
      delete payload.avatar;
    }
  } else {
    delete payload.avatar;
  }

  try {
    const result = await userControllerService.updateProfile(
      req.infoUser!.user_id,
      String(payload.username || ""),
      payload,
    );
    if (result.duplicateUsername) {
      res.status(409).json({
        success: false,
        message: "Tên đăng nhập đã tồn tại",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cập nhật thông tin thất bại",
    });
  }
};

export const createUploaderRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { reason } = req.body;
  try {
    const result = await userControllerService.createUploaderRequest(
      req.infoUser!.user_id,
      reason,
    );
    if (result.alreadyRequested) {
      res.status(409).json({
        success: false,
        message: "Bạn đã gửi yêu cầu trước đó. Vui lòng chờ admin duyệt.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Đăng ký thành công! Vui lòng chờ admin duyệt.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Đăng ký thất bại" });
  }
};

export const getFavoriteMangaList = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user_id = req.infoUser!.user_id;
    const mangas =
      await userControllerService.getFavoriteMangaListByUserId(user_id);
    res.status(200).json({
      success: true,
      message: "Lấy danh sách yêu thích thành công",
      data: mangas,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const addFavoriteManga = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user_id = req.infoUser!.user_id;
    const mangaId = Number(req.params.mangaId);

    if (!Number.isFinite(mangaId) || mangaId <= 0) {
      res.status(400).json({ success: false, message: "mangaId không hợp lệ" });
      return;
    }

    await userControllerService.addFavoriteMangaByUserId(user_id, mangaId);

    res.status(200).json({
      success: true,
      message: "Đã thêm truyện vào danh sách yêu thích",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const removeFavoriteManga = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user_id = req.infoUser!.user_id;
    const mangaId = Number(req.params.mangaId);

    if (!Number.isFinite(mangaId) || mangaId <= 0) {
      res.status(400).json({ success: false, message: "mangaId không hợp lệ" });
      return;
    }

    await userControllerService.removeFavoriteMangaByUserId(user_id, mangaId);

    res.status(200).json({
      success: true,
      message: "Đã xóa truyện khỏi danh sách yêu thích",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export const getFavoriteMangaStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user_id = req.infoUser!.user_id;
    const mangaId = Number(req.params.mangaId);

    if (!Number.isFinite(mangaId) || mangaId <= 0) {
      res.status(400).json({ success: false, message: "mangaId không hợp lệ" });
      return;
    }

    const isFavorite =
      await userControllerService.getFavoriteMangaStatusByUserId(
        user_id,
        mangaId,
      );

    res.status(200).json({
      success: true,
      message: "Lấy trạng thái yêu thích thành công",
      data: isFavorite,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
