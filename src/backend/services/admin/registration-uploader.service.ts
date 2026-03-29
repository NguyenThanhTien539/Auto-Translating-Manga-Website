import * as registerUploader from "../../models/registration-uploader";
import * as accountModel from "../../models/account.model";
import * as roleModel from "../../models/role.model";

export const listRequests = async (): Promise<any[]> => {
  const requestList = await registerUploader.findAllRequestDetails();

  return requestList.map((request) => ({
    request_id: request.request_id,
    email: request.email,
    full_name: request.full_name,
    request_status: request.request_status,
    request_created_at: request.request_created_at,
  }));
};

export const getRequestDetail = async (id: number): Promise<any> => {
  return registerUploader.findRequestDetailById(id);
};

export const updateRequestStatus = async (
  id: number,
  requestStatus: string,
): Promise<void> => {
  const updatedAt = new Date();
  await registerUploader.updateRequestStatus(id, requestStatus, updatedAt);

  if (requestStatus !== "accepted") return;

  const [requestDetail, uploaderRole] = await Promise.all([
    registerUploader.findRequestDetailById(id),
    roleModel.findByCode("UPL"),
  ]);

  if (requestDetail && uploaderRole) {
    await accountModel.updateRoleById(
      requestDetail.user_id,
      uploaderRole.role_id,
    );
  }
};
