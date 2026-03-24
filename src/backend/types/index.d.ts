import { Request } from "express";
import { Knex } from "knex";

declare global {
  var pathAdmin: string;
}

export interface UserInfo {
  user_id: number;
  email: string;
  full_name: string;
  username: string;
  password: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role_id: number;
  coin_balance: number;
  user_status: string;
}

export interface RegisterRedisData {
  email: string;
  full_name: string;
  address?: string;
  passwordHash: string;
  otpHash: string;
  attemptCount: number;
  resendCount: number;
  createdAt: number;
}

export interface AuthRequest extends Request {
  infoUser?: UserInfo;
  infoStaff?: UserInfo;
  email?: string;

  registerChallengeId?: string;
  registerChallengeKey?: string;
  registerData?: RegisterRedisData;
}

export interface RegisterInfo {
  email: string;
  password: string;
  fullName: string;
}

export interface DecodedToken {
  id: number;
  email: string;
  role: number;
  otp?: string;
  password?: string;
  fullName?: string;
}

export interface Manga {
  manga_id: number;
  title: string;
  description?: string;
  cover_image?: string;
  status: string;
  original_language?: string;
  author_id?: number;
  uploader_id?: number;
  slug?: string;
  created_at?: Date;
  updated_at?: Date;
  is_highlighted?: boolean;
  highlight_end_at?: Date;
  author_name?: string;
  genres?: string[];
  total_chapters?: number;
  average_rating?: number;
  totalChapters?: number;
}

export interface Chapter {
  chapter_id: number;
  manga_id: number;
  uploader_id?: number;
  chapter_number: number;
  title?: string;
  status?: string;
  price?: number;
  created_at?: Date;
}

export interface Page {
  page_id: number;
  chapter_id: number;
  page_number: number;
  image_url: string;
  language?: string;
}

export interface Author {
  author_id: number;
  author_name: string;
  biography?: string;
  avatar_url?: string;
}

export interface Genre {
  genre_id: number;
  genre_name: string;
}

export interface Role {
  role_id: number;
  role_name: string;
  role_code: string;
}

export interface Comment {
  comment_id?: number;
  chapter_id: number;
  user_id: number;
  content?: string;
  rating?: number;
  created_at?: Date;
  user_name?: string;
  avatar?: string;
}

export interface CoinPackage {
  id: number;
  coins: number;
  price: number;
  is_active: boolean;
}

export interface DepositTransaction {
  deposit_id?: number;
  user_id: number;
  coin_package_id: number;
  payment_method: string;
  status: string;
  order_code?: string;
}

export interface ReadingHistory {
  history_id?: number;
  user_id: number;
  chapter_id: number;
  manga_id: number;
  last_page_read: number;
  last_read_at?: Date;
}

export interface UploaderRequest {
  request_id: number;
  user_id: number;
  reason: string;
  request_status: string;
  request_created_at?: Date;
  updated_at?: Date;
}

export interface FilterParams {
  chaptersMin?: number;
  chaptersMax?: number;
  state?: string;
  categories?: string[];
}

export interface TokenVerification {
  valid: boolean;
  reason?: string;
}

export type KnexDB = Knex;
