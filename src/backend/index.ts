import express from "express";
import http from "http";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";
import clientRoutes from "./routes/client/index.route";
import adminRoutes from "./routes/admin/index.route";
import * as variableConfig from "./config/variable.config";
import { connectRedis } from "./config/redis.config";
import {
  initSocketServer,
  startSocketRedisSubscriber,
} from "./socket/socket.server";

declare global {
  var pathAdmin: string;
}

const app = express();
const port = Number(process.env.PORT);
const httpServer = http.createServer(app);

global.pathAdmin = variableConfig.pathAdmin;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

app.use("/", clientRoutes);
app.use(`/${pathAdmin}`, adminRoutes);

(async () => {
  await connectRedis();
  initSocketServer(httpServer);
  await startSocketRedisSubscriber();

  httpServer.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Set another PORT in .env`);
      process.exit(1);
    }
    throw error;
  });

  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
