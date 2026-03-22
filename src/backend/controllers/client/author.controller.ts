import { Request, Response } from "express";
import * as AuthorModel from "../../models/author.model";
import * as MangaModel from "../../models/manga.model";

export const getAllAuthors = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { name } = req.query;
    let authors;

    if (name) {
      authors = await AuthorModel.searchAuthorsByName(String(name));
    } else {
      authors = await AuthorModel.getAllAuthors();
    }

    return res.status(200).json({ code: "success", data: authors });
  } catch (error) {
    console.error("Error getting authors:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAuthorById = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const author = await AuthorModel.getAuthorById(Number(id));

    const mangas = await MangaModel.getMangasByAuthorId(Number(id));

    return res
      .status(200)
      .json({ code: "success", author: author, mangas: mangas });
  } catch (error) {
    console.error("Error getting author details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAuthorMangas = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const mangas = await AuthorModel.getMangasByAuthorId(Number(id));
    return res.status(200).json(mangas);
  } catch (error) {
    console.error("Error getting author mangas:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
