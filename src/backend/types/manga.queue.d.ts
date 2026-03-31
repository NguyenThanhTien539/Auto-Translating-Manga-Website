export interface MangaUploadJobData {
  mangaId: number;
  chapterId: number;
  uploaderId: number;
  zipPath: string;
  language: string;
  isFirstChapter: boolean;
}
