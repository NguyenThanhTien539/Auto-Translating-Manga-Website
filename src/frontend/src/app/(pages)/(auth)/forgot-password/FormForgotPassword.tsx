/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import JustValidate from "just-validate";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/app/utils/api";

export default function FormForgotPassword() {
  const router = useRouter();
  useEffect(() => {
    // Chống StrictMode gọi useEffect 2 lần trong dev

    const validation = new JustValidate("#forgotPasswordForm");

    validation
      .addField(
        "#email",
        [
          { rule: "required", errorMessage: "Vui lòng nhập email!" },
          { rule: "email", errorMessage: "Email không đúng định dạng!" },
        ],
        { errorContainer: "#emailError" },
      )
      .onSuccess(async (event: any) => {
        const email = event.target.email.value;

        const finalData = { email: email };

        try {
          const data = await api.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/account/forgot-password`,
            finalData,
          );

          if (!data.success) {
            toast.error(data.message);
          } else {
            toast.success(data.message);
            router.push(`/verify?email=${email}&type=forgot-password`);
          }
        } catch (error) {
          toast.error("Có lỗi xảy ra, vui lòng thử lại!");
        }
      });
  }, []);

  return (
    <form id="forgotPasswordForm">
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Email*
          </label>
          <input
            id="email"
            type="email"
            placeholder="Ví dụ: nva@gmail.com"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div id="emailError" className="text-sm text-red-500 mt-1" />
        </div>

        <div className="mt-2 text-center">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </form>
  );
}

