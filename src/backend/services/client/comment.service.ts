import * as commentModel from "../../models/comment.model";
import * as accountModel from "../../models/account.model";

export const add = async (payload: {
  chapter_id: number;
  user_id: number;
  content?: string;
  rating?: number;
}): Promise<void> => {
  await commentModel.insert(payload);
};

export const list = async (chapterId: number): Promise<any[]> => {
  const comments = await commentModel.findByChapterId(chapterId);
  for (const comment of comments) {
    const user = await accountModel.getUserById(comment.user_id);
    comment.user_name = user ? user.username : "Unknown";
    comment.avatar = user ? user.avatar : undefined;
  }
  return comments;
};
