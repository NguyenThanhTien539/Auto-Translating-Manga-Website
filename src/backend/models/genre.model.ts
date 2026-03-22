import db from "../config/database.config";
import { Genre } from "../types";

interface GenreData {
  genre_name: string;
}

export const insert = async (data: GenreData): Promise<number[]> => {
  return db("genres").insert(data);
};

export const findAllGenre = async (): Promise<Genre[]> => {
  return db("genres").select("*").orderBy("genre_id", "asc");
};

export const findGenreById = async (
  genreId: number,
): Promise<Genre | undefined> => {
  return db("genres").where("genre_id", genreId).first();
};

export const updateGenre = async (
  genreId: number,
  dataUpdate: Partial<Genre>,
): Promise<number> => {
  return db("genres").where("genre_id", genreId).update(dataUpdate);
};
