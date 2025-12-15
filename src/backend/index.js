const express = require("express");
require("dotenv").config();
const clientRoutes = require("./routes/client/index.route");
const adminRoutes = require("./routes/admin/index.route");
const variableConfig = require("./config/variable.config");
const cookieParse = require("cookie-parser");
const cors = require("cors");
const app = express();
const port = 5000;
const { createProxyMiddleware } = require("http-proxy-middleware");

global.pathAdmin = variableConfig.pathAdmin; //set global variable for admin routes

app.use(
  cors({
    origin: "http://localhost:3000", //allow send cookie so set specific domain
    credentials: true, //allow send cookie
  })
);

app.use(cookieParse());
app.use(express.json()); //  gửi qua bằng json

// const feProxy = createProxyMiddleware({
//   target: "http://localhost:3000",
//   changeOrigin: true,
//   ws: true,
// });

// const API_PREFIXES = ["/order-coin"];

// app.use((req, res, next) => {
//   if (req.method === "GET") {
//     const isApiGet = API_PREFIXES.some((p) => req.path.startsWith(p));
//     if (!isApiGet) return feProxy(req, res, next); // GET không phải API => sang FE
//   }
//   next(); // còn lại (POST/PATCH/...) => backend xử lý
// });

app.use("/", clientRoutes);
app.use(`/${pathAdmin}`, adminRoutes);

app.listen(port, () => {
  console.log(`Your website is running at port: http://localhost:${port}`);
});
//
