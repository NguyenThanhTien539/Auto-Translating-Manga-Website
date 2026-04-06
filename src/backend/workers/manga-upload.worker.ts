import path from "path";
import fs from "fs/promises";
import { Worker } from "bullmq";
import AdmZip, { IZipEntry } from "adm-zip";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import { MANGA_UPLOAD_QUEUE_NAME } from "../config/queue.variable.config";
import { bullMqConnection } from "../config/bullmq.config";
import type { MangaUploadJobData } from "../types/manga.queue";
import * as MangaModel from "../models/manga.model";
import {
  SOCKET_EVENTS,
  chapterStatusToAdminEvent,
  chapterStatusToUploaderEvent,
  mangaStatusToAdminEvent,
  mangaStatusToUploaderEvent,
} from "../socket/socket.events";
import { publishToAdmins, publishToUser } from "../socket/socket.emitter";
import { SocketEventName, WorkflowStatus } from "../socket/socket.types";

const cloudinaryV2 = cloudinary.v2;

cloudinaryV2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const PROJECT_ROOT = path.resolve(__dirname, "..");
const TMP_EXTRACTED_DIR = path.join(
  PROJECT_ROOT,
  "storage",
  "tmp",
  "extracted",
);

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const UPLOAD_SUCCESS_MESSAGE =
  "Truyện của bạn đã upload thành công. Chờ admin duyệt.";
const NATURAL_COLLATOR = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

const ensureDir = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

const safeFilename = (name: string): string =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_");

const normalizeEntryName = (entryName: string): string => {
  return entryName.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
};

const isValidImageEntry = (entry: IZipEntry): boolean => {
  if (entry.isDirectory) return false;

  const normalized = normalizeEntryName(entry.entryName);
  if (!normalized) return false;
  if (normalized.startsWith("__MACOSX/") || normalized.endsWith(".DS_Store")) {
    return false;
  }
  if (normalized.includes("..")) return false;

  const ext = path.extname(normalized).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
};

const loadImageEntriesFromZip = (zipPath: string): IZipEntry[] => {
  let zip: AdmZip;
  try {
    zip = new AdmZip(zipPath);
  } catch {
    throw new Error("ZIP is corrupted or cannot be read");
  }

  const imageEntries = zip.getEntries().filter(isValidImageEntry);

  if (imageEntries.length === 0) {
    throw new Error("ZIP does not contain any valid image");
  }

  imageEntries.sort((a, b) =>
    NATURAL_COLLATOR.compare(a.entryName, b.entryName),
  );
  return imageEntries;
};

const groupEntriesByChapterFolder = (
  imageEntries: IZipEntry[],
): Map<string, IZipEntry[]> => {
  const chapters = new Map<string, IZipEntry[]>();

  for (const entry of imageEntries) {
    const normalized = normalizeEntryName(entry.entryName);
    const parts = normalized.split("/").filter(Boolean);

    // Expected shape: <root?>/Chapter_xxx/<image>
    if (parts.length < 2) continue;

    const chapterFolder = parts[parts.length - 2];
    if (!chapterFolder) continue;

    if (!chapters.has(chapterFolder)) {
      chapters.set(chapterFolder, []);
    }

    chapters.get(chapterFolder)!.push(entry);
  }

  return chapters;
};

const uploadImageBuffer = async (
  buffer: Buffer,
  folder: string,
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryV2.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const parseZipEntriesForSingleChapter = async (
  zipPath: string,
  jobFolder: string,
): Promise<
  Array<{
    originalName: string;
    extractedPath: string;
  }>
> => {
  const imageEntries = loadImageEntriesFromZip(zipPath);

  await ensureDir(jobFolder);

  const extracted: Array<{ originalName: string; extractedPath: string }> = [];

  for (let i = 0; i < imageEntries.length; i++) {
    const entry = imageEntries[i];
    const ext = path.extname(entry.entryName).toLowerCase();
    const outputName = `${String(i + 1).padStart(4, "0")}${ext}`;
    const outputPath = path.join(jobFolder, safeFilename(outputName));

    const entryData = entry.getData();
    await fs.writeFile(outputPath, entryData);

    extracted.push({
      originalName: entry.entryName,
      extractedPath: outputPath,
    });
  }

  return extracted;
};

const cleanupPath = async (targetPath: string): Promise<void> => {
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch {
    // best effort cleanup
  }
};

const safePublishToUser = async (
  userId: number,
  event: SocketEventName,
  payload: Record<string, unknown>,
): Promise<void> => {
  try {
    await publishToUser(userId, event, payload);
  } catch (error) {
    console.error("Failed to publish user socket event:", error);
  }
};

const safePublishToAdmins = async (
  event: SocketEventName,
  payload: Record<string, unknown>,
): Promise<void> => {
  try {
    await publishToAdmins(event, payload);
  } catch (error) {
    console.error("Failed to publish admin socket event:", error);
  }
};

const emitChapterStatus = async (params: {
  uploaderId: number;
  chapterId: number;
  mangaId: number;
  status: WorkflowStatus;
  message: string;
  error?: string;
  review_note?: string | null;
}): Promise<void> => {
  const uploaderEvent = chapterStatusToUploaderEvent(params.status);
  const payload = {
    chapterId: params.chapterId,
    mangaId: params.mangaId,
    status: params.status,
    message: params.message,
    error: params.error,
    review_note: params.review_note ?? null,
  };

  if (uploaderEvent) {
    await safePublishToUser(params.uploaderId, uploaderEvent, payload);
  }

  const adminEvent = chapterStatusToAdminEvent(params.status);
  if (adminEvent) {
    await safePublishToAdmins(adminEvent, payload);
  }
};

const emitMangaStatus = async (params: {
  uploaderId: number;
  mangaId: number;
  status: WorkflowStatus;
  message: string;
  error?: string;
  review_note?: string | null;
}): Promise<void> => {
  const uploaderEvent = mangaStatusToUploaderEvent(params.status);
  const payload = {
    mangaId: params.mangaId,
    status: params.status,
    message: params.message,
    error: params.error,
    review_note: params.review_note ?? null,
  };

  if (uploaderEvent) {
    await safePublishToUser(params.uploaderId, uploaderEvent, payload);
  }

  const adminEvent = mangaStatusToAdminEvent(params.status);
  if (adminEvent) {
    await safePublishToAdmins(adminEvent, payload);
  }
};

const emitUploadCompleted = async (params: {
  uploaderId: number;
  mangaId: number;
  chapterId?: number;
  isNewMangaUpload: boolean;
}): Promise<void> => {
  const manga = await MangaModel.getMangaById(params.mangaId);
  const mangaTitle = manga?.title;

  await safePublishToUser(params.uploaderId, SOCKET_EVENTS.MANGA_PENDING_REVIEW, {
    mangaId: params.mangaId,
    mangaTitle,
    status: "pending_review",
    message: UPLOAD_SUCCESS_MESSAGE,
    review_note: null,
  });

  if (params.isNewMangaUpload) {
    await safePublishToAdmins(SOCKET_EVENTS.ADMIN_NEW_PENDING_MANGA, {
      mangaId: params.mangaId,
      mangaTitle,
      status: "pending_review",
      message: "Có nội dung mới cần duyệt",
    });
    return;
  }

  await safePublishToAdmins(SOCKET_EVENTS.ADMIN_NEW_PENDING_CHAPTER, {
    chapterId: params.chapterId,
    mangaId: params.mangaId,
    mangaTitle,
    status: "pending_review",
    message: "Có nội dung mới cần duyệt",
  });
};

const setFailedState = async (
  data: MangaUploadJobData,
  errorMessage?: string,
): Promise<void> => {
  if (data.mode === "single_chapter_upload" && data.chapterId) {
    await MangaModel.updateChapterWorkflowState(data.chapterId, {
      status: "processing_failed",
      processing_error: errorMessage || "Chapter processing failed",
    });
  }

  if (data.mode === "initial_manga_upload") {
    await MangaModel.updateMangaWorkflowState(data.mangaId, {
      status: "processing_failed",
      processing_error: errorMessage || "Manga processing failed",
    });
  }
};

const processSingleChapterJob = async (
  data: MangaUploadJobData,
): Promise<void> => {
  if (!data.chapterId) {
    throw new Error("Missing chapterId for single chapter upload");
  }

  const jobId = `manga_${data.mangaId}_chapter_${data.chapterId}_${Date.now()}`;
  const extractDir = path.join(TMP_EXTRACTED_DIR, safeFilename(jobId));
  const uploadedPublicIds: string[] = [];

  try {
    const extractedFiles = await parseZipEntriesForSingleChapter(
      data.zipPath,
      extractDir,
    );

    const pageRows: Array<{
      chapter_id: number;
      page_number: number;
      image_url: string;
      language: string;
    }> = [];

    for (let i = 0; i < extractedFiles.length; i++) {
      const file = extractedFiles[i];
      const uploadResult = await cloudinaryV2.uploader.upload(
        file.extractedPath,
        {
          folder: `manga/${data.mangaId}/chapter_${data.chapterId}`,
          resource_type: "image",
        },
      );

      uploadedPublicIds.push(uploadResult.public_id);

      pageRows.push({
        chapter_id: data.chapterId,
        page_number: i + 1,
        image_url: uploadResult.secure_url,
        language: data.language || "en",
      });
    }

    await MangaModel.createPages(pageRows);

    await MangaModel.updateChapterWorkflowState(data.chapterId, {
      status: "pending_review",
      processing_error: null,
      review_note: null,
    });

    await emitUploadCompleted({
      uploaderId: data.uploaderId,
      mangaId: data.mangaId,
      chapterId: data.chapterId,
      isNewMangaUpload: false,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Chapter processing failed";

    await setFailedState(data, errorMessage);

    await emitChapterStatus({
      uploaderId: data.uploaderId,
      chapterId: data.chapterId,
      mangaId: data.mangaId,
      status: "processing_failed",
      message: "Chapter processing failed",
      error: errorMessage,
    });

    for (const publicId of uploadedPublicIds) {
      try {
        await cloudinaryV2.uploader.destroy(publicId);
      } catch {
        // best effort cleanup
      }
    }

    throw error;
  } finally {
    await cleanupPath(extractDir);
  }
};

const processInitialMangaUploadJob = async (
  data: MangaUploadJobData,
): Promise<void> => {
  const uploadedPublicIds: string[] = [];
  const createdChapterIds: number[] = [];

  try {
    const imageEntries = loadImageEntriesFromZip(data.zipPath);
    const chaptersMap = groupEntriesByChapterFolder(imageEntries);

    if (chaptersMap.size === 0) {
      throw new Error(
        "ZIP must include chapter folders, e.g. Chapter_001/001.jpg",
      );
    }

    const chapterFolders = Array.from(chaptersMap.keys()).sort((a, b) =>
      NATURAL_COLLATOR.compare(a, b),
    );

    for (let index = 0; index < chapterFolders.length; index++) {
      const folderName = chapterFolders[index];
      const entries = chaptersMap.get(folderName) || [];
      if (entries.length === 0) continue;

      const numberMatch = folderName.match(/(\d+(\.\d+)?)/);
      const chapterNumber = numberMatch ? Number(numberMatch[1]) : index + 1;

      const chapter = await MangaModel.createChapter({
        manga_id: data.mangaId,
        uploader_id: data.uploaderId,
        chapter_number: chapterNumber,
        title: folderName,
        status: "processing",
      });

      createdChapterIds.push(chapter.id);

      const sortedEntries = [...entries].sort((a, b) =>
        NATURAL_COLLATOR.compare(a.entryName, b.entryName),
      );

      const pageRows: Array<{
        chapter_id: number;
        page_number: number;
        image_url: string;
        language: string;
      }> = [];

      for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        const uploadResult = await uploadImageBuffer(
          entry.getData(),
          `manga/${data.mangaId}/chapter_${chapter.id}`,
        );

        uploadedPublicIds.push(uploadResult.public_id);

        pageRows.push({
          chapter_id: chapter.id,
          page_number: i + 1,
          image_url: uploadResult.secure_url,
          language: data.language,
        });
      }

      await MangaModel.createPages(pageRows);
      await MangaModel.updateChapterWorkflowState(chapter.id, {
        status: "pending_review",
        processing_error: null,
        review_note: null,
      });

    }

    await MangaModel.updateMangaWorkflowState(data.mangaId, {
      status: "pending_review",
      processing_error: null,
      review_note: null,
    });

    await emitUploadCompleted({
      uploaderId: data.uploaderId,
      mangaId: data.mangaId,
      isNewMangaUpload: true,
    });
  } catch (error: any) {
    const errorMessage = error?.message || "ZIP processing failed";
    await setFailedState(data, errorMessage);

    for (const chapterId of createdChapterIds) {
      try {
        await MangaModel.updateChapterWorkflowState(chapterId, {
          status: "processing_failed",
          processing_error: errorMessage,
        });

        await emitChapterStatus({
          uploaderId: data.uploaderId,
          chapterId,
          mangaId: data.mangaId,
          status: "processing_failed",
          message: "Chapter processing failed",
          error: errorMessage,
        });
      } catch {
        // best effort cleanup
      }
    }

    for (const publicId of uploadedPublicIds) {
      try {
        await cloudinaryV2.uploader.destroy(publicId);
      } catch {
        // best effort cleanup
      }
    }

    await emitMangaStatus({
      uploaderId: data.uploaderId,
      mangaId: data.mangaId,
      status: "processing_failed",
      message: "Manga processing failed",
      error: errorMessage,
    });

    throw error;
  }
};

const processJob = async (data: MangaUploadJobData): Promise<void> => {
  try {
    if (data.mode === "single_chapter_upload") {
      await processSingleChapterJob(data);
      return;
    }

    await processInitialMangaUploadJob(data);
  } finally {
    await cleanupPath(data.zipPath);
  }
};

const mangaUploadWorker = new Worker<MangaUploadJobData>(
  MANGA_UPLOAD_QUEUE_NAME,
  async (job) => {
    await processJob(job.data);
  },
  {
    connection: bullMqConnection,
    concurrency: 5,
  },
);

mangaUploadWorker.on("completed", (job) => {
  console.log(`Manga upload job completed: ${job.id}`);
});

mangaUploadWorker.on("failed", (job, error) => {
  console.error(`Manga upload job failed: ${job?.id}`, error);
});

const shutdown = async () => {
  await mangaUploadWorker.close();
  await bullMqConnection.quit();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Manga upload worker is running...");
