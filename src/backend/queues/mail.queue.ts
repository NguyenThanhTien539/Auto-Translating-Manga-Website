import { JobsOptions, Queue } from "bullmq";
import { bullMqConnection } from "../config/bullmq.config";
import type { SendMailJobData } from "../types/mail.queue";
import { MAIL_QUEUE_NAME } from "../config/queue.variable.config";

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 3000,
  },
  removeOnComplete: 5,
  removeOnFail: 5,
};

export const mailQueue = new Queue<SendMailJobData>(MAIL_QUEUE_NAME, {
  connection: bullMqConnection,
  defaultJobOptions,
});

export const enqueueSendMail = async (
  data: SendMailJobData,
  options?: JobsOptions,
) => {
  const jobName = `send-mail:${data.email}`;
  return await mailQueue.add(jobName, data, options);
};
