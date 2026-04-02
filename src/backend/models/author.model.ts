import db from "../config/database.config";
import { Author, Manga } from "../types";

interface AuthorData {
  author_name: string;
  biography?: string;
  avatar_url?: string;
}

export const createAuthor = async (
  data: AuthorData,
): Promise<{ id: number }> => {
  const [id] = await db("authors").insert(data).returning("author_id");
  return { id: typeof id === "object" ? (id as any).author_id : id };
};

export const getAuthorById = async (
  authorId: number,
): Promise<Author | undefined> => {
  return db("authors").where("author_id", authorId).first();
};

export const getAuthorByExactName = async (
  authorName: string,
): Promise<Author | undefined> => {
  const normalized = authorName.trim();
  if (!normalized) return undefined;

  return db("authors")
    .whereRaw("LOWER(TRIM(author_name)) = LOWER(TRIM(?))", [normalized])
    .first();
};

export const getAllAuthors = async (): Promise<Author[]> => {
  return db("authors").select("*").orderBy("author_name", "asc");
};

export const updateAuthor = async (
  authorId: number,
  data: Partial<Author>,
): Promise<number> => {
  return db("authors").where("author_id", authorId).update(data);
};

export const deleteAuthor = async (authorId: number): Promise<number> => {
  return db("authors").where("author_id", authorId).del();
};

export const searchAuthorsByName = async (name: string): Promise<Author[]> => {
  return db("authors").where("author_name", "ilike", `%${name}%`).select("*");
};

export const getMangasByAuthorId = async (
  authorId: number,
): Promise<Partial<Manga>[]> => {
  return db("mangas")
    .where("author_id", authorId)
    .select("manga_id", "title", "coverUrl");
};

export const getAuthorDetailByAuthorId = async (
  authorId: number,
): Promise<Author | undefined> => {
  return db("authors").where("author_id", authorId).first();
};
