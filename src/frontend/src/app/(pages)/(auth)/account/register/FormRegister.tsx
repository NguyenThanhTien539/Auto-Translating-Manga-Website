// src/app/user/register/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* nền toàn màn hình */}
      <Image
        src="/bg-account.svg" // đặt file vào /public/bg-account.svg
        alt="Hình nền"
        fill
        className="fixed inset-0 -z-10 object-cover"
        priority
      />

      <form
        id="registerForm"
        className="relative z-10 w-[490px] min-h-[600px] p-8 rounded-3xl bg-white shadow"
      >
        <div className="text-center font-bold text-[30px]">
          <h1>Đăng ký</h1>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          <div>
            <label
              htmlFor="fullName"
              className="block font-medium text-sm mb-1.5"
            >
              Họ Tên*
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full rounded-lg border border-gray-500 p-2"
            />
            <div id="fullNameError" className="text-sm text-red-500"></div>
          </div>

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
            <div id="emailError" className="text-sm text-red-500"></div>
          </div>

          <div>
            <label
              htmlFor="address"
              className="block font-medium text-sm mb-1.5"
            >
              Địa chỉ*
            </label>
            <input
              id="address"
              type="text"
              placeholder="Ví dụ: Đ. Nguyễn Thông, Tân An, Long An"
              className="w-full rounded-lg border border-gray-500 p-2"
            />
            <div id="addressError" className="text-sm text-red-500"></div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-medium text-sm mb-1.5"
            >
              Mật khẩu*
            </label>
            <input
              id="password"
              type="password"
              placeholder="******"
              className="w-full rounded-lg border border-gray-500 p-2"
            />
            <div id="passwordError" className="text-sm text-red-500"></div>
          </div>

          <label className="flex items-center gap-2 mt-1">
            <input id="agree" type="checkbox" className="h-4 w-4" />
            <span>Tôi đồng ý với điều khoản</span>
          </label>
          <div
            id="agreeError"
            className="ml-7 mt-0.5 text-sm text-red-500"
          ></div>

          <div className="mt-1 text-center">
            <button
              type="submit"
              className="h-10 w-[100px] rounded-lg bg-blue-500 font-bold text-white hover:bg-blue-600"
            >
              Đăng ký
            </button>
          </div>

          <div className="text-center text-sm">
            Bạn đã có tài khoản?
            <button
              type="button"
              className="pl-1 text-blue-500 underline hover:text-blue-700"
              onClick={() => router.push("/user/login")}
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
