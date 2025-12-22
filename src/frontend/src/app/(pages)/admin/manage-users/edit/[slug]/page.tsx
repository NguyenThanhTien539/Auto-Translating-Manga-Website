/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Camera,
  Lock,
} from "lucide-react";
import { formatDate, getInitials } from "@/utils/format";

type UserDetail = {
  user_id: number;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  role_id: string;
  role_name: string;
  user_status: string;
  created_at: string;
  avatar?: string;
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.slug as string;

  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/user/detail/${userId}`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setUserDetail(data.user);
        } else {
          toast.error(data.message || "Không thể tải thông tin người dùng");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId]);

  const handleSubmit = (event: any) => {
    event.preventDefault();

    const formData = {
      role_id: event.target.role_id.value,
      user_status: event.target.user_status.value,
    };
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/user/update/${userId}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          toast.success(data.message);
          router.refresh();
        } else {
          toast.error(data.message);
        }
      });
  };

  return (
    <div className="w-full min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : userDetail ? (
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">
            Chỉnh sửa thông tin người dùng
          </h2>

          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header với avatar */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:p-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                    {userDetail.avatar ? (
                      <Image
                        src={userDetail.avatar}
                        alt={userDetail.username}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl sm:text-5xl font-bold text-white bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                        {getInitials(
                          userDetail.full_name || userDetail.username
                        )}
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={32} />
                  </div>
                </div>

                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {userDetail.full_name || userDetail.username}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {userDetail.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Tham gia: {formatDate(userDetail.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form
              id="edit-user-form"
              className="p-6 sm:p-8 space-y-6"
              onSubmit={handleSubmit}
            >
              <div className="border-t border-gray-200"></div>

              {/* Thông tin không thể thay đổi */}
              <div className="space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Lock size={18} className="text-gray-400" />
                  Thông tin không thể thay đổi
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Mail size={14} className="inline mr-1.5 text-blue-500" />
                      Email
                    </label>
                    <div className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center text-sm text-gray-600 cursor-not-allowed">
                      {userDetail.email}
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <User
                        size={14}
                        className="inline mr-1.5 text-purple-500"
                      />
                      Username
                    </label>
                    <div className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center text-sm text-gray-600 cursor-not-allowed">
                      {userDetail.username}
                    </div>
                  </div>

                  {/* Họ và tên */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <User
                        size={14}
                        className="inline mr-1.5 text-green-500"
                      />
                      Họ và tên
                    </label>
                    <div className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center text-sm text-gray-600 cursor-not-allowed">
                      {userDetail.full_name}
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Phone
                        size={14}
                        className="inline mr-1.5 text-orange-500"
                      />
                      Số điện thoại
                    </label>
                    <div className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center text-sm text-gray-600 cursor-not-allowed">
                      {userDetail.phone || "Chưa cập nhật"}
                    </div>
                  </div>

                  {/* Địa chỉ */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <MapPin
                        size={14}
                        className="inline mr-1.5 text-red-500"
                      />
                      Địa chỉ
                    </label>
                    <div className="w-full min-h-[88px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 cursor-not-allowed">
                      {userDetail.address || "Chưa cập nhật"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200"></div>

              {/* Thông tin có thể chỉnh sửa */}
              <div className="space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                  Thông tin có thể chỉnh sửa
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Vai trò */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Shield
                        size={14}
                        className="inline mr-1.5 text-indigo-500"
                      />
                      Vai trò <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="role_id"
                      name="role_id"
                      defaultValue={userDetail.role_id}
                      className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                    >
                      <option value={1}>Độc giả</option>
                      <option value={2}>Người đăng</option>
                    </select>
                  </div>

                  {/* Trạng thái */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <Shield
                        size={14}
                        className="inline mr-1.5 text-red-500"
                      />
                      Trạng thái tài khoản{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="user_status"
                      name="user_status"
                      defaultValue={userDetail.user_status}
                      className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="ban">Bị cấm</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col justify-center items-stretch sm:items-center gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="cursor-pointer flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-base font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  Lưu thay đổi
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin/manage-users")}
                  className="cursor-pointer flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-medium transition-colors"
                >
                  <ArrowLeft size={20} />
                  Quay lại
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
