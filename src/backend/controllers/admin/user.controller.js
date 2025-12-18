const userModel = require("../../models/account.model");

module.exports.list = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.json({ code: "success", userList: users });
  } catch (error) {
    res.json({ code: "error", message: "Failed to retrieve user list" });
  }
};

module.exports.detail = async (req, res) => {
  const userId = req.params.id;
  const infoDetail = await userModel.getUserById(userId);
  if (infoDetail) {
    res.json({ code: "success", user: infoDetail });
  } else {
    res.json({ code: "error", message: "User not found" });
  }
};

module.exports.update = async (req, res) => {
  const userId = req.params.id;
  try {
    const updateData = req.body;
    await userModel.updateUserById(userId, updateData);
    res.json({ code: "success", message: "Cập nhật thành công" });
  } catch (error) {
    res.json({ code: "error", message: "Cập nhật thất bại" });
  }
};
