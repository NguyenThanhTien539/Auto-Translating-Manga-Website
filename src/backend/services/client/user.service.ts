import * as accountModel from "../../models/account.model";
import * as favoriteModel from "../../models/favorite.model";
import * as uploaderRequestModel from "../../models/registration-uploader";
import { Manga } from "../../types";

export const updateProfile = async (
  userId: number,
  username: string,
  profileData: Record<string, unknown>,
): Promise<{ duplicateUsername: boolean }> => {
  const existingUser = await accountModel.checkUsernameExists(username);
  if (existingUser && existingUser.user_id !== userId) {
    return { duplicateUsername: true };
  }

  await accountModel.updateProfile(userId, profileData);
  return { duplicateUsername: false };
};

export const createUploaderRequest = async (
  userId: number,
  reason: string,
): Promise<{ alreadyRequested: boolean }> => {
  if (await uploaderRequestModel.checkExistingRequest(userId)) {
    return { alreadyRequested: true };
  }

  await uploaderRequestModel.insertReason(userId, reason);
  return { alreadyRequested: false };
};

export const getFavoriteMangaListByUserId = async (
  userId: number,
): Promise<Manga[]> => {
  return accountModel.getFavoriteMangaListByUserId(userId);
};

export const addFavoriteMangaByUserId = async (
  userId: number,
  mangaId: number,
): Promise<void> => {
  const isFavorite = await favoriteModel.isMangaFavoritedByUser(
    userId,
    mangaId,
  );
  if (isFavorite) {
    return;
  }

  await favoriteModel.addFavoriteManga(userId, mangaId);
};

export const removeFavoriteMangaByUserId = async (
  userId: number,
  mangaId: number,
): Promise<void> => {
  await favoriteModel.removeFavoriteManga(userId, mangaId);
};

export const getFavoriteMangaStatusByUserId = async (
  userId: number,
  mangaId: number,
): Promise<boolean> => {
  return favoriteModel.isMangaFavoritedByUser(userId, mangaId);
};
