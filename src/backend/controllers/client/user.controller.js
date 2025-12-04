const accountModel = require("../../models/account.model");

module.exports.profile = async (req, res) => {
  console.log(req.file);
  console.log(req.infoUser);

  if (req.file) {
    req.body.avatar = req.file.path;
  } else {
    delete req.body.avatar;
  }

  const existingUser = await accountModel.checkUsernameExists(
    req.body.username
  );
  if (existingUser && existingUser.user_id !== req.infoUser.user_id) {
    return res.json({ code: "error", message: "Tên đăng nhập đã tồn tại" });
  }

  await accountModel.updateProfile(req.infoUser.user_id, req.body);

  res.json({ code: "success", message: "Cập nhật thông tin thành công" });
};
