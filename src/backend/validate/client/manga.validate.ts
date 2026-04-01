import Joi from "joi";
import AdmZip from "adm-zip";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

interface MulterFiles {
  cover_image?: Express.Multer.File[];
  chapter_zip?: Express.Multer.File[];
  file_content?: Express.Multer.File[];
}

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp)$/i;

const parseGenres = (genres: unknown): number[] => {
  if (genres == null || genres === "") return [];

  if (Array.isArray(genres)) {
    return genres
      .map((item) => Number(item))
      .filter((value) => Number.isFinite(value) && value > 0);
  }

  if (typeof genres === "string") {
    try {
      const parsed = JSON.parse(genres);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => Number(item))
        .filter((value) => Number.isFinite(value) && value > 0);
    } catch {
      return [];
    }
  }

  return [];
};

const hasImageInsideZip = (zipPath: string): boolean => {
  const zip = new AdmZip(zipPath);
  return zip
    .getEntries()
    .some(
      (entry) => !entry.isDirectory && IMAGE_EXTENSIONS.test(entry.entryName),
    );
};

const pathExt = (filename: string): string => {
  const lower = String(filename || "").toLowerCase();
  const dotIndex = lower.lastIndexOf(".");
  return dotIndex >= 0 ? lower.slice(dotIndex) : "";
};

export const uploadManga = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const schema = Joi.object({
    title: Joi.string().trim().required().messages({
      "string.empty": "Thiếu tên truyện (title)",
    }),
    author: Joi.string().trim().min(1).required().messages({
      "any.required": "Thiếu tác giả (author)",
      "string.empty": "Thiếu tác giả (author)",
      "string.min": "Tác giả không được để trống",
    }),
    genres: Joi.any().required().messages({
      "any.required": "Thiếu thể loại (genres)",
    }),
  });

  const { error } = schema.validate(req.body, { allowUnknown: true });
  if (error) {
    res.status(400).json({
      code: "error",
      success: false,
      message: error.details[0].message,
    });
    return;
  }

  const files = (req.files || {}) as MulterFiles;
  const coverImage = files.cover_image?.[0];
  const chapterZip = files.chapter_zip?.[0];

  const genres = parseGenres(req.body.genres);

  if (!coverImage) {
    res.status(400).json({
      code: "error",
      success: false,
      message: "Thiếu ảnh bìa (cover_image)",
    });
    return;
  }

  if (!chapterZip) {
    res.status(400).json({
      code: "error",
      success: false,
      message: "Thiếu folder zip chapter (chapter_zip)",
    });
    return;
  }

  if (pathExt(chapterZip.originalname) !== ".zip") {
    res.status(400).json({
      code: "error",
      success: false,
      message: "File chapter phải là định dạng .zip",
    });
    return;
  }

  if (genres.length === 0) {
    res.status(400).json({
      code: "error",
      success: false,
      message: "Thể loại (genres) không hợp lệ",
    });
    return;
  }

  if (!chapterZip.path || !fs.existsSync(chapterZip.path)) {
    res.status(400).json({
      code: "error",
      success: false,
      message: "Không tìm thấy file zip đã tải lên",
    });
    return;
  }

  try {
    if (!hasImageInsideZip(chapterZip.path)) {
      res.status(400).json({
        code: "error",
        success: false,
        message: "File zip không chứa ảnh chapter hợp lệ",
      });
      return;
    }
  } catch {
    res.status(400).json({
      code: "error",
      success: false,
      message: "Không thể đọc file zip chapter",
    });
    return;
  }

  next();
};
