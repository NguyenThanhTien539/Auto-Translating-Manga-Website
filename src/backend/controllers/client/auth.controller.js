const jwt = require("jsonwebtoken");
const AccountModel = require("../../models/account.model");
const RoleModel = require("../../models/role.model");
module.exports.check = async (req, res) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      res.json({ code: "error", message: "Token không hợp lệ" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, email } = decoded;
    const existedEmail = await AccountModel.findEmail(email, id);

    if (!existedEmail) {
      res.json({ code: "error", message: "Token không hợp lệ" });
      return;
    }
    const detailedRole = await RoleModel.findById(existedEmail.role_id);
    const infoUser = {
      id: existedEmail.user_id,
      fullName: existedEmail.full_name,
      email: existedEmail.email,
      username: existedEmail.username,
      role: detailedRole.role_name,
      phone: existedEmail.phone,
      address: existedEmail.address,
      avatar: existedEmail.avatar,
      coin_balance: existedEmail.coin_balance,
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

module.exports.logout = async (req, res) => {
  res.clearCookie("accessToken");
  res.json({ code: "success", message: "Đăng xuất thành công" });
};
