import { Request, Response } from "express";
import * as AuthorModel from "../../models/author.model";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const createAuthor = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { author_name, biography, avatar_url } = req.body;

    if (!author_name) {
      return res.status(400).json({ message: "Author name is required" });
    }

    const result = await AuthorModel.createAuthor({
      author_name,
      biography,
      avatar_url,
    });

    return res.status(201).json({
      message: "Author created successfully",
      authorId: result.id,
    });
  } catch (error) {
    console.error("Error creating author:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAuthor = async (
  req: MulterRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    req.body.avatar_url = req.file ? req.file.path : req.body.avatar_url;

    await AuthorModel.updateAuthor(Number(id), req.body);

    return res
      .status(200)
      .json({ code: "success", message: "Cập nhật tác giả thành công" });
  } catch (error) {
    console.error("Error updating author:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAuthor = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;

    const count = await AuthorModel.deleteAuthor(Number(id));

    if (count === 0) {
      return res.status(404).json({ message: "Author not found to delete" });
    }

    return res.status(200).json({ message: "Author deleted successfully" });
  } catch (error) {
    console.error("Error deleting author:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

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

    return res.status(200).json({ code: "success", authors: authors });
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

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    return res.status(200).json(author);
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
