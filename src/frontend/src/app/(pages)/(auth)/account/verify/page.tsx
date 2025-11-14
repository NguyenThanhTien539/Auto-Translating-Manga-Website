/* eslint-disable @typescript-eslint/no-explicit-any */
// import JustValidate from "just-validate";
"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OTPForm from "./OTPForm";
import { toast } from "sonner";
import Image from "next/image";
// const params = new URLSearchParams(window.location.search);
// const verifyType = params.get("type");

function AccountVerify() {
  const router = useRouter();


  const [otpValue, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: any) => {
    event.preventDefault();

    if (otpValue.trim().length !== 6) {
      setError("Vui lòng nhập đủ 6 chữ số");
      return;
    }
    const finalData = { otp: otpValue };
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
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="fixed inset-0 ">
        <Image
          src="/bg-account.svg"
          alt="Hình nền"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>

      <form
        id="registerVerify"
        action=""
        // onSubmit={(e) => e.preventDefault()}
        className="relative z-20 bg-white/85 w-[40%] min-h-[400px] rounded-[20%] p-6 shadow-2xl shadow-green-500"
      >
        <div className="text-center font-bold font-sans text-[30px] p-[20px] text-gray-400">
          <h1>Nhập mã OTP</h1>
          <p className="font-medium text-[13px] mt-[10px]">
            Vui lòng nhập mã OTP để tiếp tục
          </p>
        </div>

        <div className="flex flex-col px-5 gap-4">
          <div className="flex flex-col items-center">
            <div
              id="otpInputWrapper"
              tabIndex={0}
              className="w-full flex flex-col items-center mt-[50px]"
            >
              <OTPForm
                className="flex scale-150"
                onChange={(val) => {
                  setOtp(val);
                }}
              />
            </div>
            <div className="text-red-500 flex mt-10 ml-3">{error}</div>
          </div>
        </div>

        <div className="mt-[20px]  text-center">
          <button
            className="bg-blue-300 hover:bg-green-300 hover:scale-105 transition-all duration-300 border mx-auto  border-[#DEDEDE] rounded-lg px-4 py-2 font-bold text-[16px] text-white cursor-pointer"
            type="submit"
            onClick={handleSubmit}
          >
            Xác nhận mã OTP
          </button>
        </div>

        <div className="text-center text-[14px] mt-2">
          Quay lại trang đăng ký?
          <span
            className="pl-[10px] cursor-pointer underline"
            onClick={() => router.push("/account/register")}
          >
            Đăng ký
          </span>
        </div>
      </form>
    </div>
  );
}

export default AccountVerify;
