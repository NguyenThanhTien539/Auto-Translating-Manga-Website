import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import clientRoutes from "./routes/client/index.route";
import adminRoutes from "./routes/admin/index.route";
import * as variableConfig from "./config/variable.config";

dotenv.config();

declare global {
  var pathAdmin: string;
}

const app = express();
const port = 5000;

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

app.listen(port, () => {
  console.log(`Your website is running at port: http://localhost:${port}`);
});
