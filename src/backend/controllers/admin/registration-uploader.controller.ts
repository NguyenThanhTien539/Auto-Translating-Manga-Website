import { Request, Response } from "express";
import * as registrationService from "../../services/admin/registration-uploader.service";

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestList = await registrationService.listRequests();
    res.json({
      code: "success",
      list: requestList,
    });
  } catch (error) {
    res.json({ code: "error", message: "Lỗi server" });
  }
};

export const detail = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const requestDetail = await registrationService.getRequestDetail(
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
    await registrationService.updateRequestStatus(Number(id), request_status);

    res.json({
      code: "success",
      message: "Cập nhật trạng thái thành công",
    });
  } catch (error) {
    res.json({ code: "error", message: "Cập nhật trạng thái thất bại" });
  }
};
