/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/user/reset-password/FormResetPassword.tsx
"use client";

import JustValidate from "just-validate";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/utils/api";

export default function FormResetPassword() {
  const router = useRouter();
  useEffect(() => {
    const validation = new JustValidate("#resetPasswordForm");

    validation
      // Mật khẩu mới
      .addField(
        "#password",
        [
          { rule: "required", errorMessage: "Vui lòng nhập mật khẩu!" },
          {
            validator: (value: string) => value.length >= 8,
            errorMessage: "Mật khẩu có ít nhất 8 kí tự!",
          },
          {
            validator: (value: string) => /[A-Z]/.test(value),
            errorMessage: "Mật khẩu phải chứa ít nhất một chữ cái in hoa!",
          },
          {
            validator: (value: string) => /[a-z]/.test(value),
            errorMessage: "Mật khẩu phải chứa ít nhất một chữ cái thường!",
          },
          {
            validator: (value: string) => /\d/.test(value),
            errorMessage: "Mật khẩu phải chứa ít nhất một chữ số!",
          },
          {
            validator: (value: string) => /[@$!%*?&]/.test(value),
            errorMessage: "Mật khẩu phải chứa ít nhất một ký tự đặc biệt!",
          },
        ],
        { errorContainer: "#passwordError" },
      )
      // Xác nhận mật khẩu
      .addField(
        "#confirmPassword",
        [
          { rule: "required", errorMessage: "Vui lòng xác nhận mật khẩu!" },
          {
            validator: (value: string) => {
              const passwordInput =
                document.querySelector<HTMLInputElement>("#password");
              return passwordInput ? value === passwordInput.value : false;
            },
            errorMessage: "Mật khẩu xác nhận không khớp!",
          },
        ],
        { errorContainer: "#confirmPasswordError" },
      )
      .onSuccess(async (event: any) => {
        const password = event.target.password.value;

        const finalData = {
          password: password,
        };

        try {
          const data = await api.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/account/reset-password`,
            finalData,
          );

          if (!data.success) {
            toast.error(data.message);
          } else {
            toast.success(data.message);
            router.push("/login");
          }
        } catch (error) {
          toast.error("Có lỗi xảy ra, vui lòng thử lại!");
        }
      });
  }, []);

  return (
    <form id="resetPasswordForm">
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Mật khẩu mới*
          </label>
          <input
            id="password"
            type="password"
            placeholder="Nhập mật khẩu mới"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div id="passwordError" className="text-sm text-red-500 mt-1"></div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Xác nhận mật khẩu*
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div
            id="confirmPasswordError"
            className="text-sm text-red-500 mt-1"
          ></div>
        </div>

        <div className="mt-2 text-center">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </form>
  );
}
