import * as GenreModel from "../../models/genre.model";
import { Genre } from "../../types";

interface CreateGenreInput {
  genre_name: string;
}

export const createGenre = async (payload: CreateGenreInput): Promise<void> => {
  await GenreModel.insert({ genre_name: payload.genre_name });
};

export const listGenres = async (): Promise<Genre[]> => {
  return GenreModel.findAllGenres();
};

export const getGenreDetail = async (
  genreId: number,
): Promise<Genre | undefined> => {
  return GenreModel.findGenreById(genreId);
};

export const updateGenre = async (
  genreId: number,
  payload: Partial<Genre>,
): Promise<void> => {
  await GenreModel.updateGenre(genreId, payload);
};
