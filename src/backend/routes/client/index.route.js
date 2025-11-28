const route = require("express").Router();
const homeRoute = require("./home.route");
const accountRoute = require("./account.route");
const authRoute = require("./auth.route");

route.use("/", homeRoute);

route.use("/api/account", accountRoute);

route.use("/api/auth", authRoute);

module.exports = route;
