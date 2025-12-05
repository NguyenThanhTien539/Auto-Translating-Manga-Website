const registerUploader = require("../../models/registration-uploader");

module.exports.list = async (req, res) => {
  const requestList = await registerUploader.findAllRequestDetails();
  const finalList = [];
  for (let i = 0; i < requestList.length; i++) {
    finalList.push({
      request_id: requestList[i].request_id,
      email: requestList[i].email,
      full_name: requestList[i].full_name,
      request_status: requestList[i].request_status,
      request_created_at: requestList[i].request_created_at,
    });
  }

  res.json({
    code: "success",
    list: finalList,
  });
};

module.exports.detail = async (req, res) => {
  const { id } = req.params;
  try {
    const requestDetail = await registerUploader.findRequestDetailById(id);
    res.json({ code: "success", registrationDetail: requestDetail });
  } catch (error) {
    res.json({ code: "error", message: "Request not found" });
  }
};
