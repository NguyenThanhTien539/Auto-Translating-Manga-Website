export type WorkflowStatus =
  | "draft"
  | "processing"
  | "pending_review"
  | "published"
  | "rejected"
  | "processing_failed";

export type UploaderChapterEvent =
  | "chapter:processing"
  | "chapter:progress"
  | "chapter:pending_review"
  | "chapter:failed"
  | "chapter:published"
  | "chapter:rejected";

export type UploaderMangaEvent =
  | "manga:processing"
  | "manga:pending_review"
  | "manga:failed"
  | "manga:published"
  | "manga:rejected";

export type AdminEvent =
  | "admin:new-pending-chapter"
  | "admin:new-pending-manga"
  | "admin:chapter-processing-failed"
  | "admin:manga-processing-failed";

export type SocketEventName = UploaderChapterEvent | UploaderMangaEvent | AdminEvent;

export interface ChapterSocketPayload {
  chapterId: number;
  mangaId: number;
  status: WorkflowStatus;
  message: string;
  progress?: number;
  error?: string;
  review_note?: string | null;
}

export interface MangaSocketPayload {
  mangaId: number;
  status: WorkflowStatus;
  message: string;
  error?: string;
  review_note?: string | null;
}

export interface RedisSocketMessage {
  room: string;
  event: SocketEventName;
  payload: Record<string, unknown>;
}

