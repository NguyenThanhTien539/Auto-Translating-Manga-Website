const route = require("express").Router();

const accountController = require("../../controllers/client/account.controller");
const accountValidate = require("../../validate/client/account.validate");

route.post("/register", accountValidate.register, accountController.register);

route.post("/verify-register", accountController.registerVerify);

route.post("/login", accountValidate.login, accountController.login);
module.exports = route;
