export type WorkflowStatus =
  | "draft"
  | "processing"
  | "pending_review"
  | "published"
  | "rejected"
  | "processing_failed";

export interface ChapterSocketPayload {
  chapterId: number;
  mangaId: number;
  mangaTitle?: string;
  status: WorkflowStatus;
  message: string;
  progress?: number;
  error?: string;
  review_note?: string | null;
}

export interface MangaSocketPayload {
  mangaId: number;
  mangaTitle?: string;
  status: WorkflowStatus;
  message: string;
  error?: string;
  review_note?: string | null;
}

export type AdminSocketPayload = ChapterSocketPayload | MangaSocketPayload;
