import * as AuthorModel from "../../models/author.model";
import { Author } from "../../types";

export const createAuthor = async (payload: {
  author_name: string;
  biography?: string;
  avatar_url?: string;
}): Promise<number> => {
  const result = await AuthorModel.createAuthor(payload);
  return result.id;
};

export const updateAuthor = async (
  id: number,
  payload: Partial<Author>,
): Promise<void> => {
  await AuthorModel.updateAuthor(id, payload);
};

export const deleteAuthor = async (id: number): Promise<number> => {
  return AuthorModel.deleteAuthor(id);
};

export const getAllAuthors = async (name?: string): Promise<any> => {
  if (name) {
    return AuthorModel.searchAuthorsByName(String(name));
  }
  return AuthorModel.getAllAuthors();
};

export const getAuthorById = async (id: number): Promise<any> => {
  return AuthorModel.getAuthorById(id);
};

export const getAuthorMangas = async (id: number): Promise<any> => {
  return AuthorModel.getMangasByAuthorId(id);
};
