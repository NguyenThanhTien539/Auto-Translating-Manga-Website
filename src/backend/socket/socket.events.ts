import {
  AdminEvent,
  UploaderChapterEvent,
  UploaderMangaEvent,
  WorkflowStatus,
} from "./socket.types";

export const SOCKET_EVENTS = {
  CHAPTER_PROCESSING: "chapter:processing",
  CHAPTER_PROGRESS: "chapter:progress",
  CHAPTER_PENDING_REVIEW: "chapter:pending_review",
  CHAPTER_FAILED: "chapter:failed",
  CHAPTER_PUBLISHED: "chapter:published",
  CHAPTER_REJECTED: "chapter:rejected",

  MANGA_PROCESSING: "manga:processing",
  MANGA_PENDING_REVIEW: "manga:pending_review",
  MANGA_FAILED: "manga:failed",
  MANGA_PUBLISHED: "manga:published",
  MANGA_REJECTED: "manga:rejected",

  ADMIN_NEW_PENDING_CHAPTER: "admin:new-pending-chapter",
  ADMIN_NEW_PENDING_MANGA: "admin:new-pending-manga",
  ADMIN_CHAPTER_PROCESSING_FAILED: "admin:chapter-processing-failed",
  ADMIN_MANGA_PROCESSING_FAILED: "admin:manga-processing-failed",
} as const;

export const chapterStatusToUploaderEvent = (
  status: WorkflowStatus,
): UploaderChapterEvent | null => {
  if (status === "processing") return SOCKET_EVENTS.CHAPTER_PROCESSING;
  if (status === "pending_review") return SOCKET_EVENTS.CHAPTER_PENDING_REVIEW;
  if (status === "processing_failed") return SOCKET_EVENTS.CHAPTER_FAILED;
  if (status === "published") return SOCKET_EVENTS.CHAPTER_PUBLISHED;
  if (status === "rejected") return SOCKET_EVENTS.CHAPTER_REJECTED;
  return null;
};

export const mangaStatusToUploaderEvent = (
  status: WorkflowStatus,
): UploaderMangaEvent | null => {
  if (status === "processing") return SOCKET_EVENTS.MANGA_PROCESSING;
  if (status === "pending_review") return SOCKET_EVENTS.MANGA_PENDING_REVIEW;
  if (status === "processing_failed") return SOCKET_EVENTS.MANGA_FAILED;
  if (status === "published") return SOCKET_EVENTS.MANGA_PUBLISHED;
  if (status === "rejected") return SOCKET_EVENTS.MANGA_REJECTED;
  return null;
};

export const chapterStatusToAdminEvent = (
  status: WorkflowStatus,
): AdminEvent | null => {
  if (status === "pending_review") return SOCKET_EVENTS.ADMIN_NEW_PENDING_CHAPTER;
  if (status === "processing_failed") {
    return SOCKET_EVENTS.ADMIN_CHAPTER_PROCESSING_FAILED;
  }
  return null;
};

export const mangaStatusToAdminEvent = (
  status: WorkflowStatus,
): AdminEvent | null => {
  if (status === "pending_review") return SOCKET_EVENTS.ADMIN_NEW_PENDING_MANGA;
  if (status === "processing_failed") return SOCKET_EVENTS.ADMIN_MANGA_PROCESSING_FAILED;
  return null;
};

