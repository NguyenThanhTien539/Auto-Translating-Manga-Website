import db from "../config/database.config";
import { Comment } from "../types";

interface CommentData {
  chapter_id: number;
  user_id: number;
  content?: string;
  rating?: number;
}

export const insert = async (data: CommentData): Promise<number[]> => {
  return db("comments").insert(data);
};

export const findByChapterId = async (
  chapterId: number,
): Promise<Comment[]> => {
  return db("comments")
    .where("chapter_id", chapterId)
    .orderBy("created_at", "desc");
};
