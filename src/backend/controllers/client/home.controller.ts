import { Request, Response } from "express";
import * as Manga from "../../models/manga.model";

export const home = async (req: Request, res: Response): Promise<void> => {
  res.send("Thanh Tien ne");
};

const slugify = (input: string = ""): string =>
  input
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getSearchResults = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const keyword = (req.query.keyword ?? "").toString().trim();
    if (!keyword) return res.json({ code: "success", data: [] });

    const slug = slugify(keyword);

    const mangas = await Manga.searchMangaBySlug({ slug });

    const mangasWithRating = await Promise.all(
      (mangas || []).map(async (m) => {
        const mangaId = m?.manga_id;

        if (!mangaId) {
          return { ...m, average_rating: 0 };
        }

        const avg = await Manga.calculateAverageRating(mangaId);
        return { ...m, average_rating: Number(avg) || 0 };
      }),
    );

    return res.json({ code: "success", data: mangasWithRating });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: "error", message: "Lỗi server" });
  }
};
