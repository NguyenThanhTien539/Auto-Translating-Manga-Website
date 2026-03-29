import * as userModel from "../../models/account.model";
import { UserInfo } from "../../types";

export const listUsers = async (): Promise<UserInfo[]> => {
  return userModel.getAllUsers();
};

export const getUserDetail = async (
  userId: number,
): Promise<UserInfo | undefined> => {
  return userModel.getUserById(userId);
};

export const updateUser = async (
  userId: number,
  updateData: Partial<UserInfo>,
): Promise<void> => {
  await userModel.updateUserById(userId, updateData);
};
