import { Request, Response } from "express";
import * as registerUploader from "../../models/registration-uploader";
import * as accountModel from "../../models/account.model";
import * as roleModel from "../../models/role.model";

export const list = async (req: Request, res: Response): Promise<void> => {
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

export const detail = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const requestDetail = await registerUploader.findRequestDetailById(
      Number(id),
    );
    res.json({ code: "success", registrationDetail: requestDetail });
  } catch (error) {
    res.json({ code: "error", message: "Request not found" });
  }
};

export const updateStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { request_status } = req.body;
  try {
    const updated_at = new Date();
    await registerUploader.updateRequestStatus(
      Number(id),
      request_status,
      updated_at,
    );

    if (request_status === "accepted") {
      const requestDetail = await registerUploader.findRequestDetailById(
        Number(id),
      );
      const uploaderRole = await roleModel.findByCode("UPL");
      if (requestDetail && uploaderRole) {
        await accountModel.updateRoleById(
          requestDetail.user_id,
          uploaderRole.role_id,
        );
      }
    }

    res.json({
      code: "success",
      message: "Cập nhật trạng thái thành công",
    });
  } catch (error) {
    res.json({ code: "error", message: "Cập nhật trạng thái thất bại" });
  }
};
