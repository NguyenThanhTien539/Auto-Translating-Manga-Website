import IORedis from "ioredis";
import { getSocketServer, SOCKET_REDIS_CHANNEL } from "./socket.server";
import { ADMIN_ROOM, toUserRoom } from "./socket.rooms";
import { RedisSocketMessage, SocketEventName } from "./socket.types";

let publisherClient: IORedis | null = null;

const getPublisherClient = (): IORedis => {
  if (publisherClient) return publisherClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is required for socket emitter");
  }

  publisherClient = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  publisherClient.on("error", (error) => {
    console.error("Socket emitter redis error:", error);
  });

  return publisherClient;
};

export const emitToRoom = (
  room: string,
  event: SocketEventName,
  payload: Record<string, unknown>,
): void => {
  const io = getSocketServer();
  if (!io) return;
  io.to(room).emit(event, payload);
};

export const emitToUser = (
  userId: number,
  event: SocketEventName,
  payload: Record<string, unknown>,
): void => {
  emitToRoom(toUserRoom(userId), event, payload);
};

export const emitToAdmins = (
  event: SocketEventName,
  payload: Record<string, unknown>,
): void => {
  emitToRoom(ADMIN_ROOM, event, payload);
};

export const publishSocketMessage = async (
  message: RedisSocketMessage,
): Promise<void> => {
  const publisher = getPublisherClient();
  await publisher.publish(SOCKET_REDIS_CHANNEL, JSON.stringify(message));
};

export const publishToUser = async (
  userId: number,
  event: SocketEventName,
  payload: Record<string, unknown>,
): Promise<void> => {
  await publishSocketMessage({
    room: toUserRoom(userId),
    event,
    payload,
  });
};

export const publishToAdmins = async (
  event: SocketEventName,
  payload: Record<string, unknown>,
): Promise<void> => {
  await publishSocketMessage({
    room: ADMIN_ROOM,
    event,
    payload,
  });
};

