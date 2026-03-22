import db from "../config/database.config";
import { UploaderRequest, UserInfo } from "../types";

interface RequestDetail extends UploaderRequest, Omit<Partial<UserInfo>, 'user_id'> {}

export const insertReason = async (
  user_id: number,
  reason: string,
): Promise<number[]> => {
  return db("uploader_requests").insert({ user_id, reason });
};

export const findAllRequestDetails = async (): Promise<RequestDetail[]> => {
  return db("uploader_requests")
    .select("*")
    .join("users", "uploader_requests.user_id", "users.user_id");
};

export const findRequestDetailById = async (
  request_id: number,
): Promise<RequestDetail | undefined> => {
  return db("uploader_requests")
    .select("*")
    .join("users", "uploader_requests.user_id", "users.user_id")
    .where("uploader_requests.request_id", request_id)
    .first();
};

export const updateRequestStatus = async (
  request_id: number,
  request_status: string,
  updated_at: Date,
): Promise<number> => {
  return db("uploader_requests")
    .where("request_id", request_id)
    .update({ request_status, updated_at });
};

export const checkExistingRequest = async (
  user_id: number,
): Promise<UploaderRequest | undefined> => {
  return db("uploader_requests")
    .where("user_id", user_id)
    .andWhere("request_status", "pending")
    .first();
};
