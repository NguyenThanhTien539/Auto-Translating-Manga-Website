"use client";
import { io, Socket } from "socket.io-client";

let socketClient: Socket | null = null;

const getSocketBaseUrl = (): string => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  try {
    return new URL(baseUrl).origin;
  } catch {
    return baseUrl;
  }
};

export const getSocketClient = (): Socket => {
  if (socketClient) return socketClient;

  socketClient = io(getSocketBaseUrl(), {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  return socketClient;
};
