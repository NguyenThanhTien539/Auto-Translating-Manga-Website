const route = require("express").Router();
const homeRoute = require("./home.route");
const accountRoute = require("./account.route");


route.use("/", homeRoute);

route.use("/api/account", accountRoute);

module.exports = route;
