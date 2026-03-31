import path from "path";
import fs from "fs/promises";
import { Worker } from "bullmq";
import AdmZip from "adm-zip";
import cloudinary from "cloudinary";
import { MANGA_UPLOAD_QUEUE_NAME } from "../config/queue.variable.config";
import { bullMqConnection } from "../config/bullmq.config";
import type { MangaUploadJobData } from "../types/manga.queue";
import * as MangaModel from "../models/manga.model";

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

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const ensureDir = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

const safeFilename = (name: string): string =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_");

const parseZipEntries = async (
  zipPath: string,
  jobFolder: string,
): Promise<
  Array<{
    originalName: string;
    extractedPath: string;
  }>
> => {
  let zip: AdmZip;
  try {
    zip = new AdmZip(zipPath);
  } catch {
    throw new Error("ZIP bị lỗi hoặc không thể đọc");
  }

  const entries = zip.getEntries();
  const imageEntries = entries.filter((entry) => {
    if (entry.isDirectory) return false;

    const normalized = entry.entryName.replace(/\\/g, "/");
    if (
      normalized.startsWith("__MACOSX/") ||
      normalized.endsWith(".DS_Store")
    ) {
      return false;
    }

    if (normalized.includes("..")) return false;

    const ext = path.extname(normalized).toLowerCase();
    return IMAGE_EXTENSIONS.has(ext);
  });

  if (imageEntries.length === 0) {
    throw new Error("ZIP không có ảnh hợp lệ");
  }

  const collator = new Intl.Collator("en", {
    numeric: true,
    sensitivity: "base",
  });
  imageEntries.sort((a, b) => collator.compare(a.entryName, b.entryName));

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

const setFailedState = async (data: MangaUploadJobData): Promise<void> => {
  await MangaModel.updateChapterWorkflowState(data.chapterId, {
    status: "processing_failed",
  });

  if (data.isFirstChapter) {
    await MangaModel.updateMangaWorkflowState(data.mangaId, {
      status: "processing_failed",
    });
  }
};

const processJob = async (data: MangaUploadJobData): Promise<void> => {
  const jobId = `manga_${data.mangaId}_chapter_${data.chapterId}_${Date.now()}`;
  const extractDir = path.join(TMP_EXTRACTED_DIR, jobId);
  const uploadedPublicIds: string[] = [];

  try {
    const extractedFiles = await parseZipEntries(data.zipPath, extractDir);

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
    });

    if (data.isFirstChapter) {
      await MangaModel.updateMangaWorkflowState(data.mangaId, {
        status: "pending_review",
      });
    }
  } catch (error: any) {
    const message = error?.message || "Xử lý ZIP thất bại";
    await setFailedState(data);

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
    concurrency: 2,
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
