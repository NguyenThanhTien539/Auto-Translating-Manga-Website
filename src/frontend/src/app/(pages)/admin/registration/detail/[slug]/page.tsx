"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  X,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
} from "lucide-react";
import TinyMCEEditor from "@/app/components/TinyMCEEditor";
import { formatDate } from "@/utils/format";

type RegistrationDetail = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  username: string;
  reason: string;
  request_status: "pending" | "accepted" | "rejected";
  request_created_at: string;
};

export default function RegistrationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const editorRef = useRef(null);
  const [registrationDetail, setRegistrationDetail] =
    useState<RegistrationDetail | null>(null);
  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/registration-uploader/detail/${slug}`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setRegistrationDetail(data.registrationDetail);
        }
      });
  }, []);

  const handleStatusUpdate = (newStatus: "accepted" | "rejected") => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/registration-uploader/update-status/${slug}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ request_status: newStatus }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          toast.success(data.message);
          setRegistrationDetail((prev) => {
            if (prev) {
              return { ...prev, request_status: newStatus };
            } else {
              return prev;
            }
          });
        } else {
          toast.error(data.message || "Cập nhật trạng thái thất bại.");
        }
      });
  };
  return (
    registrationDetail && (
      <div className="w-full min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">
            Chi tiết đơn đăng ký
          </h2>

          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header Section with Status */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    {registrationDetail?.full_name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={16} className="flex-shrink-0" />
                    <span className="font-medium">
                      @{registrationDetail?.username}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-3">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${
                      registrationDetail?.request_status === "pending"
                        ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                        : registrationDetail?.request_status === "accepted"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                        : "bg-red-100 text-red-600 border border-red-300"
                    }`}
                  >
                    {registrationDetail.request_status === "pending"
                      ? "⏳ Chờ duyệt"
                      : registrationDetail?.request_status === "accepted"
                      ? "✓ Đã chấp nhận"
                      : "✗ Đã từ chối"}
                  </span>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Calendar size={16} className="flex-shrink-0" />
                    <span>
                      {formatDate(registrationDetail?.request_created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
              {/* Contact Information Cards */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Thông tin liên hệ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Email Card */}
                  <div className="group bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Mail size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Email
                        </label>
                        <p className="text-sm font-medium text-gray-900 break-all">
                          {registrationDetail?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Phone Card */}
                  <div className="group bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Phone size={20} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Số điện thoại
                        </label>
                        <p className="text-sm font-medium text-gray-900">
                          {registrationDetail.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Username Card */}
                  <div className="group bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <User size={20} className="text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Username
                        </label>
                        <p className="text-sm font-medium text-gray-900">
                          {registrationDetail.username}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Address Card */}
                  <div className="group bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                        <MapPin size={20} className="text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Địa chỉ
                        </label>
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {registrationDetail.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason Section with TinyMCE */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Lý do xin nộp đơn
                </h4>
                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <TinyMCEEditor
                    value={registrationDetail.reason}
                    editorRef={editorRef}
                    isReadOnly={true}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 border-t border-gray-200">
              <div className="flex flex-col items-center gap-3">
                {registrationDetail?.request_status === "pending" && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <button
                      className="cursor-pointer flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-emerald-500 text-white text-sm sm:text-base font-semibold hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      onClick={() => handleStatusUpdate("accepted")}
                    >
                      <Check size={20} />
                      Chấp nhận đơn
                    </button>
                    <button
                      className=" cursor-pointer flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-red-500 text-white text-sm sm:text-base font-semibold hover:bg-red-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      onClick={() => handleStatusUpdate("rejected")}
                    >
                      <X size={20} />
                      Từ chối đơn
                    </button>
                  </div>
                )}

                <button
                  onClick={() => router.push("/admin/registration/list")}
                  className="cursor-pointer flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={18} />
                  Quay lại trang danh sách
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
