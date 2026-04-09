/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Camera,
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import JustValidate from "just-validate";
import { useEffect, useState } from "react";

registerPlugin(FilePondPluginFileValidateType, FilePondPluginImagePreview);

export default function ProfileDetailPage() {
  const router = useRouter();
  const { infoUser } = useAuth();
  const [avatar, setAvatar] = useState<any[]>([]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  useEffect(() => {
    if (infoUser?.avatar && avatar.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvatar([
        {
          source: infoUser.avatar,
        },
      ]);
    }

    if (infoUser) {
      const validator = new JustValidate("#profile-form");
      validator
        .addField("#full_name", [
          { rule: "required", errorMessage: "Họ tên không được để trống" },
        ])
        .addField("#phone", [
          {
            rule: "required",
            errorMessage: "Số điện thoại không được để trống",
          },
          {
            rule: "number",
            errorMessage: "Số điện thoại chỉ được chứa chữ số",
          },
        ])
        .addField("#address", [
          { rule: "required", errorMessage: "Địa chỉ không được để trống" },
        ]);
    }
  }, [infoUser, avatar.length]);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const username = event.target.username.value;
    const full_name = event.target.full_name.value;
    const phone = event.target.phone.value;
    const address = event.target.address.value;

    let avt: File | null = null;
    if (
      avatar.length > 0 &&
      avatar[0].file &&
      avatar[0].source !== infoUser?.avatar
    ) {
      avt = avatar[0].file;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("full_name", full_name);
    formData.append("phone", phone);
    formData.append("address", address);

    if (avt) {
      console.log("Appending avatar to formData:", avt);
      formData.append("avatar", avt);
    }
    console.log("FormData entries:");
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/me`,
        {
          method: "PATCH",
          credentials: "include",
          body: formData,
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.message || "Cập nhật thông tin thất bại");
        return;
      }

      if (data?.success) {
        toast.success(data.message || "Cập nhật thông tin thành công");
        router.push("/profile");
      } else {
        toast.error(data?.message || "Cập nhật thông tin thất bại");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    }
  };

  return (
    <>
      {infoUser && (
        <div className="w-full min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">
              Chỉnh sửa thông tin cá nhân
            </h2>

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header với avatar */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:p-8 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="relative group">
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                      {infoUser.avatar ? (
                        <Image
                          src={infoUser.avatar}
                          alt={infoUser.username}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl sm:text-5xl font-bold text-white bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
                          {getInitials(infoUser.full_name || infoUser.username)}
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white" size={32} />
                    </div>
                  </div>

                  <div className="text-center sm:text-left flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {infoUser.full_name || infoUser.username}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {infoUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form
                id="profile-form"
                className="p-6 sm:p-8 space-y-6"
                onSubmit={handleSubmit}
              >
                <div className="border-t border-gray-200"></div>

                {/* 🔒 Chỉ email là không thể thay đổi */}
                <div className="space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Lock size={18} className="text-gray-400" />
                    Thông tin không thể thay đổi
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <Mail
                          size={14}
                          className="inline mr-1.5 text-blue-500"
                        />
                        Email
                      </label>
                      <div className="w-full h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 flex items-center text-sm text-gray-500 cursor-not-allowed">
                        {infoUser.email}
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

                  {/* 2 ô 1 dòng */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <User
                          size={14}
                          className="inline mr-1.5 text-purple-500"
                        />
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        defaultValue={infoUser.username}
                        className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Nhập username của bạn"
                      />
                    </div>

                    {/* Họ và tên */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <User
                          size={14}
                          className="inline mr-1.5 text-green-500"
                        />
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        defaultValue={infoUser.fullName}
                        className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Nhập họ và tên của bạn"
                      />
                    </div>

                    {/* Số điện thoại */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <Phone
                          size={14}
                          className="inline mr-1.5 text-orange-500"
                        />
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        defaultValue={infoUser.phone}
                        className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Nhập số điện thoại (VD: 0901234567)"
                      />
                    </div>

                    {/* Địa chỉ – full 1 dòng (2 cột) */}
                    <div className="space-y-2 sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <MapPin
                          size={14}
                          className="inline mr-1.5 text-red-500"
                        />
                        Địa chỉ <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        defaultValue={infoUser.address}
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                        placeholder="Nhập địa chỉ chi tiết của bạn"
                      />
                    </div>
                  </div>

                  {/* Ảnh đại diện – để full dòng phía dưới */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      <Camera
                        size={14}
                        className="inline mr-1.5 text-purple-500"
                      />
                      Ảnh đại diện
                    </label>
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300">
                      <FilePond
                        name="avatar"
                        allowMultiple={false} // Chỉ chọn 1 ảnh
                        allowRemove={true} // Cho phép xóa ảnh
                        labelIdle='Kéo thả ảnh vào đây hoặc <span class="filepond--label-action">Chọn file</span>'
                        acceptedFileTypes={["image/*"]}
                        onupdatefiles={setAvatar}
                        files={avatar}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col  justify-center  items-stretch sm:items-center gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="cursor-pointer flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-base font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={20} />
                    Lưu thay đổi
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
