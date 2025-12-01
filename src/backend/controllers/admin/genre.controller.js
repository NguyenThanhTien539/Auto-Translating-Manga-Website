const GenreModel = require("../../models/genre.model");

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
