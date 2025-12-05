const accountModel = require("../../models/account.model");
const uploaderRequestModel = require("../../models/registration-uploader");

module.exports.profile = async (req, res) => {
  if (req.file) {
    req.body.avatar = req.file.path;
  } else {
    delete req.body.avatar;
  }

  const existingUser = await accountModel.checkUsernameExists(
    req.body.username
  );
  console.log(req.body);
  if (existingUser && existingUser.user_id !== req.infoUser.user_id) {
    return res.json({ code: "error", message: "Tên đăng nhập đã tồn tại" });
  }

  try {
    await accountModel.updateProfile(req.infoUser.user_id, req.body);
    res.json({ code: "success", message: "Cập nhật thông tin thành công" });
  } catch (error) {
    res.json({ code: "error", message: "Cập nhật thông tin thất bại" });
  }
};

module.exports.registerUploader = async (req, res) => {
  const { reason } = req.body;
  try {
    await uploaderRequestModel.insertReason(req.infoUser.user_id, reason);
    res.json({
      code: "success",
      message: "Đăng ký thành công! Vui lòng chờ admin duyệt.",
    });
  } catch (error) {
    res.json({ code: "error", message: "Đăng ký thất bại" });
  }
};

