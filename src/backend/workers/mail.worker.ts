import { Worker } from "bullmq";
import type { SendMailJobData } from "../types/mail.queue";
import { MAIL_QUEUE_NAME } from "../config/queue.variable.config";
import { bullMqConnection } from "../config/bullmq.config";
import * as mailHelper from "../helper/mail.helper";

const mailWorker = new Worker<SendMailJobData>(
  MAIL_QUEUE_NAME,
  async (job) => {
    const { email, title, content } = job.data;
    await mailHelper.sendMail(email, title, content);
  },
  {
    connection: bullMqConnection,
    concurrency: 5,
  },
);

mailWorker.on("completed", (job) => {
  console.log(`Mail job completed: ${job.id}`);
});

mailWorker.on("failed", (job, error) => {
  console.error(`Mail job failed: ${job?.id}`, error);
});

const shutdown = async () => {
  await mailWorker.close();
  await bullMqConnection.quit();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Mail worker is running...");
