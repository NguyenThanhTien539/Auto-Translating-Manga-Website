/* eslint-disable @typescript-eslint/no-explicit-any */
// import JustValidate from "just-validate";
"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OTPForm from "./OTPForm";
import { toast } from "sonner";

function AccountVerify() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyType = searchParams.get("type");

  const [otpValue, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: any) => {
    event.preventDefault();

    if (otpValue.trim().length !== 6) {
      setError("Vui lòng nhập đủ 6 chữ số");
      return;
    }
    const finalData = { otp: otpValue };

    if (verifyType == "forgot-password") {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/account/verify-forgot-password`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalData),
        },
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "success") {
            toast.success(data.message);
            const email = searchParams.get("email");
            router.push(`/account/reset-password?email=${email}`);
          }
          if (data.code == "error") {
            toast.error(data.message);
            router.push("/account/forgot-password");
          }
          if (data.code == "otp error") {
            toast.error(data.message);
          }
        });
    } else {
      console.log("Submitting OTP for registration verification:", finalData); // Debug log
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/verify-register`, {
        method: "post",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "success") {
            toast.success(data.message);
            router.push("/account/login");
          }
          if (data.code == "error") {
            toast.error(data.message);
            router.push("/account/register");
          }
          if (data.code == "otp error") {
            toast.error(data.message);
          }
        });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <form
        id="registerVerify"
        action=""
        className="relative bg-white w-full max-w-md mx-4 rounded-2xl p-8 shadow-xl border border-gray-100"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Xác thực tài khoản
          </h1>
          <p className="text-sm text-gray-500">
            Nhập mã OTP đã được gửi đến email của bạn
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div
            id="otpInputWrapper"
            tabIndex={0}
            className="w-full flex justify-center mb-3"
          >
            <OTPForm
              className="flex gap-2"
              onChange={(val) => {
                setOtp(val);
                setError("");
              }}
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center mt-3 animate-pulse">
              {error}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
          type="submit"
          onClick={handleSubmit}
        >
          Xác nhận
        </button>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Chưa có tài khoản?{" "}
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline"
            onClick={() => router.push("/account/register")}
          >
            Đăng ký ngay
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AccountVerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountVerify />
    </Suspense>
  );
}
