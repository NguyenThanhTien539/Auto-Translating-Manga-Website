import db from "../config/database.config";

export const searchMangaByTitle = async ({
  keyword,
  limit = 20,
  offset = 0,
}: {
  keyword: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> => {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const likePattern = `%${normalizedKeyword}%`;
  const isShortKeyword = normalizedKeyword.length < 3;

  const query = db("mangas as m")
    .leftJoin("authors as a", "a.author_id", "m.author_id")
    .leftJoin("manga_genre as mg", "mg.manga_id", "m.manga_id")
    .leftJoin("genres as g", "g.genre_id", "mg.genre_id")
    .leftJoin("chapters as c", "c.manga_id", "m.manga_id")
    .modify((q) => {
      if (isShortKeyword) {
        q.whereRaw("LOWER(m.title) LIKE ?", [likePattern]);
        return;
      }

      q.whereRaw("(LOWER(m.title) % ? OR LOWER(m.title) LIKE ?)", [
        normalizedKeyword,
        likePattern,
      ]);
    })
    .groupBy(
      "m.manga_id",
      "m.title",
      "m.slug",
      "m.description",
      "m.cover_image",
      "m.status",
      "m.original_language",
      "m.created_at",
      "m.updated_at",
      "a.author_name",
    )
    .select(
      "m.manga_id",
      "m.title",
      "m.slug",
      "m.description",
      "m.cover_image",
      "m.status",
      "m.original_language",
      "m.created_at",
      "m.updated_at",
      db.raw("COALESCE(a.author_name, 'Unknown') as author_name"),
      db.raw("COUNT(DISTINCT c.chapter_id)::int as total_chapters"),
      db.raw("ARRAY_REMOVE(ARRAY_AGG(DISTINCT g.genre_name), NULL) as genres"),
    );

  if (isShortKeyword) {
    query.orderByRaw("m.updated_at DESC NULLS LAST");
  } else {
    query.orderByRaw(
      "similarity(LOWER(m.title), ?) DESC, m.updated_at DESC NULLS LAST",
      [normalizedKeyword],
    );
  }

  const rows = await query.limit(limit).offset(offset);

  return rows as any[];
};
