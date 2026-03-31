import * as AuthorModel from "../../models/author.model";
import * as MangaModel from "../../models/manga.model";

export const getAllAuthors = async (name?: string): Promise<any> => {
  if (name) {
    return AuthorModel.searchAuthorsByName(String(name));
  }
  return AuthorModel.getAllAuthors();
};

export const getAuthorById = async (
  id: number,
): Promise<{ author: any; mangas: any }> => {
  const author = await AuthorModel.getAuthorById(id);
  const mangas = await MangaModel.getMangasByAuthorId(id);
  return { author, mangas };
};

export const getAuthorMangas = async (id: number): Promise<any> => {
  return AuthorModel.getMangasByAuthorId(id);
};
