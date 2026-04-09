type FavoriteApiResult = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

const buildFavoriteUrl = (mangaId: string | number): string => {
  return `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/me/favorite-mangas/${mangaId}`;
};

export const addFavoriteManga = async (
  mangaId: string | number,
): Promise<FavoriteApiResult> => {
  const response = await fetch(buildFavoriteUrl(mangaId), {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}) as FavoriteApiResult);

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Không thể thêm truyện vào yêu thích");
  }

  return data;
};

export const removeFavoriteManga = async (
  mangaId: string | number,
): Promise<FavoriteApiResult> => {
  const response = await fetch(buildFavoriteUrl(mangaId), {
    method: "DELETE",
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}) as FavoriteApiResult);

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Không thể xóa truyện khỏi yêu thích");
  }

  return data;
};
