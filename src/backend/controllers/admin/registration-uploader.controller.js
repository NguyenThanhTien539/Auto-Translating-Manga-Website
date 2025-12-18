const registerUploader = require("../../models/registration-uploader");
const accountModel = require("../../models/account.model");
const roleModel = require("../../models/role.model");

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

module.exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { request_status } = req.body;
  try {
    const updated_at = new Date();
    await registerUploader.updateRequestStatus(id, request_status, updated_at);

    if (request_status === "accepted") {
      const requestDetail = await registerUploader.findRequestDetailById(id);
      const uploaderRole = await roleModel.findByCode("UPL"); // assuming role_code "uploader" is for uploader
      await accountModel.updateRoleById(
        requestDetail.user_id,
        uploaderRole.role_id
      );
    }

    res.json({
      code: "success",
      message: "Cập nhật trạng thái thành công",
    });
  } catch (error) {
    res.json({ code: "error", message: "Cập nhật trạng thái thất bại" });
  }
};
