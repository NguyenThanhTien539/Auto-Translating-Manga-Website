const GenreModel = require("../../models/genre.model");
const AccountModel = require("../../models/account.model");

module.exports.create = async (req, res) => {
  try {
    req.body.created_by = req.infoStaff.user_id;
    req.body.updated_by = req.infoStaff.user_id;
    await GenreModel.insert(req.body);
    res.json({
      code: "success",
      message: "Tạo thể loại mới thành công",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Tạo thể loại mới thất bại",
    });
  }
};

module.exports.list = async (req, res) => {
  try {
    const genreList = await GenreModel.findAllGenre();

    for (const item of genreList) {
      const createInfo = await AccountModel.findId(item.created_by);
      item.created_by = createInfo.full_name;
      const updateInfo = await AccountModel.findId(item.updated_by);
      item.updated_by = updateInfo.full_name;
    }
    res.json({
      code: "success",
      list: genreList,
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Có lỗi xảy ra ở đây",
    });
  }
};
