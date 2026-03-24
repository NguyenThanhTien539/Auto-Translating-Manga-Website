import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";
import clientRoutes from "./routes/client/index.route";
import adminRoutes from "./routes/admin/index.route";
import * as variableConfig from "./config/variable.config";
import { connectRedis } from "./config/redis.config";

declare global {
  var pathAdmin: string;
}

const app = express();
const port = 5000;

global.pathAdmin = variableConfig.pathAdmin;

// connectRedis();

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

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
