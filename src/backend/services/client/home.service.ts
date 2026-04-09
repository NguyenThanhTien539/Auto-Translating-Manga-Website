import * as Manga from "../../models/manga.model";
import * as MangaSearch from "../../models/manga-search.model";

export const getSearchResults = async (keyword: string): Promise<any[]> => {
  if (!keyword) return [];

  const mangas = await MangaSearch.searchMangaByTitle({ keyword });

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
