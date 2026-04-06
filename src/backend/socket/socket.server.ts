import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import IORedis from "ioredis";
import * as accountModel from "../models/account.model";
import * as roleModel from "../models/role.model";
import { DecodedToken, UserInfo } from "../types";
import { ADMIN_ROOM, toUserRoom } from "./socket.rooms";
import { RedisSocketMessage } from "./socket.types";

export const SOCKET_REDIS_CHANNEL = "socket:events";

let ioServer: SocketIOServer | null = null;
let subscriberClient: IORedis | null = null;

interface SocketUserData {
  userId: number;
  roleCode: string;
}

const parseCookie = (
  cookieHeader: string | undefined,
): Record<string, string> => {
  if (!cookieHeader) return {};

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const separator = pair.indexOf("=");
      if (separator <= 0) return acc;

      const key = pair.slice(0, separator).trim();
      const value = decodeURIComponent(pair.slice(separator + 1).trim());
      acc[key] = value;
      return acc;
    }, {});
};

const authenticateSocketUser = async (
  socket: Socket,
): Promise<{ user: UserInfo; roleCode: string }> => {
  const cookies = parseCookie(socket.handshake.headers.cookie);
  const accessToken = cookies.accessToken;

  if (!accessToken) {
    throw new Error("Missing access token");
  }

  const decoded = jwt.verify(
    accessToken,
    process.env.JWT_SECRET,
  ) as DecodedToken;

  const user = await accountModel.findAminAuthToken(
    decoded.id,
    decoded.email,
    decoded.role,
  );

  if (!user) {
    throw new Error("Invalid access token");
  }

  const role = await roleModel.findById(decoded.role);
  const roleCode = role?.role_code || "";

  return { user, roleCode };
};

const attachSocketHandlers = (
  socket: Socket,
  userData: SocketUserData,
): void => {
  socket.join(toUserRoom(userData.userId));

  if (userData.roleCode === "ADM") {
    socket.join(ADMIN_ROOM);
  }

  socket.emit("socket:ready", {
    userId: userData.userId,
    role: userData.roleCode,
    message: "Connected to realtime updates",
  });
};

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  if (ioServer) return ioServer;

  ioServer = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN,
      credentials: true,
    },
  });

  ioServer.use(async (socket, next) => {
    try {
      const { user, roleCode } = await authenticateSocketUser(socket);
      socket.data.user = {
        userId: user.user_id,
        roleCode,
      } as SocketUserData;
      next();
    } catch (error: any) {
      next(new Error(error?.message || "Unauthorized socket connection"));
    }
  });

  ioServer.on("connection", (socket) => {
    const userData = socket.data.user as SocketUserData;
    attachSocketHandlers(socket, userData);
  });

  return ioServer;
};

export const getSocketServer = (): SocketIOServer | null => ioServer;

export const startSocketRedisSubscriber = async (): Promise<void> => {
  if (subscriberClient) return;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is required for socket redis subscriber");
  }

  const io = getSocketServer();
  if (!io) {
    throw new Error("Socket server not initialized");
  }

  subscriberClient = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  await subscriberClient.subscribe(SOCKET_REDIS_CHANNEL);

  subscriberClient.on("message", (_channel, rawMessage) => {
    try {
      const message = JSON.parse(rawMessage) as RedisSocketMessage;
      if (!message?.room || !message?.event) return;

      io.to(message.room).emit(message.event, message.payload);
    } catch (error) {
      console.error("Failed to parse socket redis message:", error);
    }
  });
};
