import * as Manga from "../../models/manga.model";

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

export const getSearchResults = async (keyword: string): Promise<any[]> => {
  if (!keyword) return [];

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

  return mangasWithRating;
};
