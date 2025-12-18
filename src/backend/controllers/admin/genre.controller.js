const GenreModel = require("../../models/genre.model");

module.exports.create = async (req, res) => {
  try {
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

module.exports.detail = async (req, res) => {
  try {
    const genreId = req.params.id;
    const genreDetail = await GenreModel.findGenreById(genreId);
    res.json({
      code: "success",
      detail: genreDetail,
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Có lỗi xảy ra ở đây",
    });
  }
};

module.exports.edit = async (req, res) => {
  try {
    const genreId = req.params.id;
    const dataUpdate = req.body;
    await GenreModel.updateGenre(genreId, dataUpdate);
    res.json({
      code: "success",
      message: "Cập nhật thể loại thành công",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Cập nhật thể loại thất bại",
    });
  }
};
