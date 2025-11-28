const jwt = require("jsonwebtoken");
const AccountModel = require("../../models/account.model");
module.exports.check = async (req, res) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      res.json({ code: "error", message: "Token không hợp lệ" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    const { id, email } = decoded;
    const existedEmail = await AccountModel.findEmail(email, id);

    if (!existedEmail) {
      res.json({ code: "error", message: "Token không hợp lệ" });
      return;
    }

    const infoUser = {
      id: existedEmail.id,
      fullName: existedEmail.full_name,
      email: existedEmail.email,
      username: existedEmail.username,
      role: decoded.role,
    };

    res.json({
      code: "success",
      message: "Token hợp lệ",
      infoUser: infoUser,
    });
  } catch (error) {
    res.clearCookie("accessToken");
    res.json({ code: "error", message: "Token không hợp lệ" });
  }
};
