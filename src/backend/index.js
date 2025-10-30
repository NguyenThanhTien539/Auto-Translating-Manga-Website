const express = require("express");
require("dotenv").config();
const clientRoutes = require("./routes/client/index.route");
const adminRoutes = require("./routes/admin/index.route");
const variableConfig = require("./config/variable.config");

const app = express();
const port = 5000;

global.pathAdmin = variableConfig.pathAdmin;//set global variable for admin routes


console.log(pathAdmin); 
app.use("/", clientRoutes);
app.use(`${pathAdmin}/`, adminRoutes);

app.listen(port, () => {
  console.log(`Your website is running at port: http://localhost:${port}`);
});
//
