module.exports.home = async (req, res) => {
  res.send("Thanh Tien ne");
};

module.exports.getSearchResults = async (req, res) => {
  try {
    const { query } = req.query;

  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Lỗi server",
    });
  }
};