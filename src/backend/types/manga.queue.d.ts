export interface MangaUploadJobData {
  mode: "initial_manga_upload" | "single_chapter_upload";
  mangaId: number;
  chapterId?: number;
  uploaderId: number;
  zipPath: string;
  language: string;
}
