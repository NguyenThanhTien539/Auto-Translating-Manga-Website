/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/user/reset-password/FormResetPassword.tsx
"use client";

import JustValidate from "just-validate";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function FormResetPassword() {
  const router = useRouter();
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  console.log(email);
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
        { errorContainer: "#passwordError" }
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
        { errorContainer: "#confirmPasswordError" }
      )
      .onSuccess((event: any) => {
        const password = event.target.password.value;

        const finalData = {
          email: email,
          password: password,
        };

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(finalData),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.code === "error") {
              toast.error(data.message);
            }

            if (data.code === "success") {
              toast.success(data.message);
              router.push("/account/login");
            }
          });
      });
  }, []);

  return (
    <form id="resetPasswordForm">
      <div className="flex flex-col gap-4 mt-6">
        <div>
          <label
            htmlFor="password"
            className="block font-medium text-sm mb-1.5"
          >
            Mật khẩu mới*
          </label>
          <input
            id="password"
            type="password"
            placeholder="******"
            className="w-full rounded-lg border border-gray-500 p-2"
          />
          <div id="passwordError" className="text-sm text-red-500"></div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block font-medium text-sm mb-1.5"
          >
            Xác nhận mật khẩu*
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu"
            className="w-full rounded-lg border border-gray-500 p-2"
          />
          <div id="confirmPasswordError" className="text-sm text-red-500"></div>
        </div>

        <div className="mt-1 text-center">
          <button
            type="submit"
            className="h-10 w-[120px] rounded-lg bg-blue-500 font-bold text-white hover:bg-blue-600 cursor-pointer"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </form>
  );
}
