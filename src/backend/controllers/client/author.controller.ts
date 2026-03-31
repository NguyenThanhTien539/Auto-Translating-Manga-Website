import { Request, Response } from "express";
import * as authorControllerService from "../../services/client/author.service";

export const getAllAuthors = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { name } = req.query;
    const authors = await authorControllerService.getAllAuthors(
      name ? String(name) : undefined,
    );

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
    const { author, mangas } = await authorControllerService.getAuthorById(
      Number(id),
    );

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
    const mangas = await authorControllerService.getAuthorMangas(Number(id));
    return res.status(200).json(mangas);
  } catch (error) {
    console.error("Error getting author mangas:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
