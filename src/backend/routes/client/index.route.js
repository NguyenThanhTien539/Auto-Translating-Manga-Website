const route = require("express").Router();
const homeRoute = require("./home.route");
const accountRoute = require("./account.route");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");


route.use("/", homeRoute);

route.use("/account", accountRoute);

route.use("/auth", authRoute);

route.use("/user", userRoute);

module.exports = route;
