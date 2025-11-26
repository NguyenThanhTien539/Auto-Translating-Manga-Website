/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import JustValidate from "just-validate";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
        { errorContainer: "#emailError" }
      )
      .onSuccess((event: any) => {
        const email = event.target.email.value;

        const finalData = { email: email };

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/forgot-password`, {
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
              router.push(
                `/account/verify?email=${email}&type=forgot-password`
              );
            }

            if (data.code === "existedOTP") {
              toast.success(data.message);
              router.push(
                `/account/verify?email=${email}&type=forgot-password`
              );
            }
          });
      });
  }, []);

  return (
    <form id="forgotPasswordForm">
      <div className="flex flex-col gap-4 mt-6">
        <div>
          <label htmlFor="email" className="block font-medium text-sm mb-1.5">
            Email*
          </label>
          <input
            id="email"
            type="email"
            placeholder="Ví dụ: nva@gmail.com"
            className="w-full rounded-lg border border-gray-500 p-2"
          />
          <div id="emailError" className="text-sm text-red-500" />
        </div>

        <div className="mt-1 text-center">
          <button
            type="submit"
            className="h-10 w-[160px] rounded-lg bg-blue-500 font-bold text-white hover:bg-blue-600 cursor-pointer"
          >
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </form>
  );
}
