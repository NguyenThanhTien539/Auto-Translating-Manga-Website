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

const hasImageInsideZip = (zipPath: string): boolean => {
  const zip = new AdmZip(zipPath);
  return zip
    .getEntries()
    .some(
      (entry) => !entry.isDirectory && IMAGE_EXTENSIONS.test(entry.entryName),
    );
};

const hasChapterFolderWithImageInsideZip = (zipPath: string): boolean => {
  const zip = new AdmZip(zipPath);

  return zip.getEntries().some((entry) => {
    if (entry.isDirectory) return false;
    if (!IMAGE_EXTENSIONS.test(entry.entryName)) return false;

    const normalized = entry.entryName.replace(/\\/g, "/").replace(/^\/+/, "");
    const segments = normalized.split("/").filter(Boolean);

    return segments.length >= 2;
  });
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
      "string.empty": "Vui lòng nhập tên truyện",
    }),
    author_name: Joi.string().trim().min(1).required().messages({
      "any.required": "Thiếu tác giả (author_name)",
      "string.empty": "Thiếu tác giả (author_name)",
      "string.min": "Tác giả không được để trống",
    }),
    genres: Joi.string()
      .required()
      .custom((value, helpers) => {
        try {
          const parsed = JSON.parse(value);
          if (
            !Array.isArray(parsed) ||
            parsed.length === 0 ||
            !parsed.every((x) => Number.isInteger(x) && x > 0)
          ) {
            return helpers.error("any.invalid");
          }
          return value;
        } catch {
          return helpers.error("any.invalid");
        }
      })
      .messages({
        "any.required": "Thiếu thể loại (genres)",
        "string.empty": "Thiếu thể loại (genres)",
        "any.invalid": "Thể loại (genres) không hợp lệ",
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
      message: "Thiếu file zip chapter (chapter_zip)",
    });
    return;
  }

  if (pathExt(chapterZip.originalname) !== ".zip") {
    res.status(400).json({
      code: "error",
      success: false,
      message: "File chapter phải là file zip",
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

    if (!hasChapterFolderWithImageInsideZip(chapterZip.path)) {
      res.status(400).json({
        code: "error",
        success: false,
        message:
          "File zip phải có cấu trúc folder chapter (vd: Chapter_001/001.jpg)",
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
