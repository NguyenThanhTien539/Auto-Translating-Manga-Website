import { JobsOptions, Queue } from "bullmq";
import { bullMqConnection } from "../config/bullmq.config";
import type { MangaUploadJobData } from "../types/manga.queue";
import { MANGA_UPLOAD_QUEUE_NAME } from "../config/queue.variable.config";

const defaultJobOptions: JobsOptions = {
  attempts: 2,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: 20,
  removeOnFail: 50,
};

export const mangaUploadQueue = new Queue<MangaUploadJobData>(
  MANGA_UPLOAD_QUEUE_NAME,
  {
    connection: bullMqConnection,
    defaultJobOptions,
  },
);

export const enqueueMangaUploadJob = async (
  data: MangaUploadJobData,
  options?: JobsOptions,
) => {
  const jobName = `manga:${data.mangaId}:chapter:${data.chapterId}`;
  return mangaUploadQueue.add(jobName, data, options);
};
