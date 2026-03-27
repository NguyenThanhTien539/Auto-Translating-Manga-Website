import IORedis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is required for BullMQ connection");
}

export const bullMqConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

bullMqConnection.on("error", (error) => {
  console.error("BullMQ Redis connection error:", error);
});
