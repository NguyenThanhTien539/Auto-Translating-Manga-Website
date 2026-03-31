import * as accountModel from "../../models/account.model";
import * as uploaderRequestModel from "../../models/registration-uploader";

export const profile = async (
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

export const registerUploader = async (
  userId: number,
  reason: string,
): Promise<{ alreadyRequested: boolean }> => {
  if (await uploaderRequestModel.checkExistingRequest(userId)) {
    return { alreadyRequested: true };
  }

  await uploaderRequestModel.insertReason(userId, reason);
  return { alreadyRequested: false };
};
