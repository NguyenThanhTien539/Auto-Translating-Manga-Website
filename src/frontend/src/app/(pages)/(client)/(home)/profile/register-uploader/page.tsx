/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import JustValidate from "just-validate";
import dynamic from "next/dynamic";
const TinyMCEEditor = dynamic(() => import("@/app/components/TinyMCEEditor"), {
  ssr: false,
});

export default function RegisterUploaderPage() {
  const router = useRouter();
  const { infoUser } = useAuth();
  const editorRef = useRef<any>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const uploaderRules = [
    {
      icon: Shield,
      title: "Kiểm duyệt nội dung",
      description:
        "Mọi truyện manga của bạn sẽ được kiểm duyệt bởi Admin trước khi được công khai trên nền tảng.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: AlertCircle,
      title: "Nội dung phù hợp",
      description:
        "Không đăng tải nội dung phản cảm, bạo lực, khiêu dâm, hoặc vi phạm pháp luật Việt Nam.",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      icon: CheckCircle2,
      title: "Bản quyền hợp pháp",
      description:
        "Chỉ đăng tải các tác phẩm mà bạn có quyền sở hữu hoặc được phép phân phối. Không vi phạm bản quyền.",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: FileText,
      title: "Chất lượng nội dung",
      description:
        "Đảm bảo chất lượng hình ảnh rõ nét, đầy đủ nội dung, và có thông tin mô tả chi tiết.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: AlertCircle,
      title: "Trách nhiệm với cộng đồng",
      description:
        "Tôn trọng độc giả, không spam, không quảng cáo trái phép. Vi phạm có thể dẫn đến khóa tài khoản vĩnh viễn.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: Shield,
      title: "Tuân thủ quy định",
      description:
        "Tuân thủ mọi điều khoản sử dụng và chính sách của nền tảng. Admin có quyền từ chối hoặc gỡ bỏ nội dung không phù hợp.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  useEffect(() => {
    if (infoUser) {
      const validator = new JustValidate("#register-uploader-form");
      validator
        .addField(
          "#checkbox",
          [
            {
              rule: "required",
              errorMessage: "Bạn phải đồng ý với các điều khoản",
            },
          ],
          {
            errorContainer: "#errorCheckbox",
          }
        )
        .onSuccess((event: any) => {
          event.preventDefault();
          const reason = editorRef.current.getContent();
          if (reason.trim() === "") {
            toast.error("Lý do không được để trống");
            return;
          }
          const finalData = { reason: reason };

          fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/register-uploader`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(finalData),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.code === "success") {
                toast.success(
                  data.message ||
                    "Đăng ký thành công! Vui lòng chờ admin duyệt."
                );
                router.push("/profile");
              } else {
                toast.error(data.message || "Đăng ký thất bại");
              }
            });
        });
    }
  }, [infoUser]);

  return (
    <>
      {infoUser && (
        <div className="w-full min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">
              Đăng ký trở thành Uploader
            </h2>

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 sm:p-8">
                <div className="text-center text-white">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <FileText size={48} className="text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">
                    Đơn đăng ký Uploader
                  </h3>
                  <p className="text-sm sm:text-base text-white/90">
                    Điền đầy đủ thông tin và đồng ý với các quy định để gửi đơn
                    đăng ký
                  </p>
                </div>
              </div>

              {/* Form */}
              <form
                id="register-uploader-form"
                className="p-6 sm:p-8 space-y-6"
              >
                {/* Nguyên tắc và quy định */}
                <div className="space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Shield size={18} className="text-blue-500" />
                    Nguyên tắc và quy định Uploader
                  </h4>
                  <p className="text-sm text-gray-600">
                    Vui lòng đọc kỹ và tuân thủ các quy định sau khi trở thành
                    Uploader
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploaderRules.map((rule, index) => {
                      const Icon = rule.icon;
                      return (
                        <div
                          key={index}
                          className={`${rule.bgColor} border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all group`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`${rule.color} p-2 bg-white rounded-lg group-hover:scale-110 transition-transform flex-shrink-0`}
                            >
                              <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5
                                className={`font-semibold text-sm mb-1 ${rule.color}`}
                              >
                                {rule.title}
                              </h5>
                              <p className="text-xs text-gray-700 leading-relaxed">
                                {rule.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Checkbox đồng ý điều khoản */}
                  <div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          id="checkbox"
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        />
                        <span className="text-sm text-gray-800 leading-relaxed group-hover:text-gray-900">
                          Tôi đã đọc, hiểu rõ và đồng ý tuân thủ tất cả các{" "}
                          <span className="font-bold text-blue-600">
                            nguyên tắc và quy định
                          </span>{" "}
                          của Uploader. Tôi cam kết chịu trách nhiệm với mọi nội
                          dung tôi đăng tải.
                        </span>
                      </label>
                    </div>

                    <div
                      id="errorCheckbox"
                      className="text-red-600 text-sm mt-1"
                    ></div>
                  </div>
                </div>

                <div className="border-t border-gray-200"></div>

                {/* Thông tin cá nhân (read-only) */}
                <div className="space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Lock size={18} className="text-gray-400" />
                    Thông tin cá nhân
                  </h4>
                  <p className="text-sm text-gray-600">
                    Thông tin này được lấy từ hồ sơ của bạn và không thể thay
                    đổi
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        {infoUser.fullName || "Chưa cập nhật"}
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
                        {infoUser.username}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <Mail
                          size={14}
                          className="inline mr-1.5 text-blue-500"
                        />
                        Email
                      </label>
                      <div className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center text-sm text-gray-600 cursor-not-allowed">
                        {infoUser.email}
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
                        {infoUser.phone || "Chưa cập nhật"}
                      </div>
                    </div>

                    {/* Địa chỉ - full width */}
                    <div className="space-y-2 sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <MapPin
                          size={14}
                          className="inline mr-1.5 text-red-500"
                        />
                        Địa chỉ
                      </label>
                      <div className="w-full min-h-[88px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 cursor-not-allowed">
                        {infoUser.address || "Chưa cập nhật"}
                      </div>
                    </div>
                  </div>

                  {/* Warning nếu thiếu thông tin */}
                  {(!infoUser.fullName ||
                    !infoUser.phone ||
                    !infoUser.address) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <p className="text-sm text-yellow-800 flex items-start gap-2">
                        <span className="text-yellow-500 font-bold text-lg">
                          ⚠
                        </span>
                        <span>
                          Vui lòng cập nhật đầy đủ thông tin cá nhân trước khi
                          đăng ký.{" "}
                          <button
                            type="button"
                            onClick={() => router.push("/profile/detail")}
                            className="underline font-semibold hover:text-yellow-900"
                          >
                            Cập nhật ngay
                          </button>
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200"></div>

                {/* Lý do đăng ký */}
                <div className="space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-purple-500" />
                    Lý do đăng ký <span className="text-red-500">*</span>
                  </h4>
                  <p className="text-sm text-gray-600">
                    Hãy cho chúng tôi biết tại sao bạn muốn trở thành Uploader
                    và bạn có kinh nghiệm gì trong lĩnh vực này
                  </p>

                  <div
                    id="reason"
                    className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm"
                  >
                    <TinyMCEEditor value="" editorRef={editorRef} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col justify-center items-stretch sm:items-center gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="cursor-pointer flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-base font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-indigo-500"
                  >
                    <Save size={20} />
                    Gửi đơn đăng ký
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-medium transition-colors"
                  >
                    <ArrowLeft size={20} />
                    Quay lại
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
