/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/user/register/page.tsx
"use client";
import JustValidate from "just-validate";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function FormRegister() {
  const router = useRouter();
  useEffect(() => {
    const validation = new JustValidate("#registerForm");
    validation
      .addField(
        "#fullName",
        [
          { rule: "required", errorMessage: "Vui lòng nhập họ tên!" },
          {
            rule: "minLength",
            value: 5,
            errorMessage: "Họ tên phải có ít nhất 5 kí tự!",
          },
          {
            rule: "maxLength",
            value: 50,
            errorMessage: "Họ tên không được quá 50 kí tự!",
          },
        ],
        { errorContainer: "#fullNameError" }
      )
      .addField(
        "#email",
        [
          { rule: "required", errorMessage: "Vui lòng nhập email!" },
          { rule: "email", errorMessage: "Email không đúng định dạng!" },
        ],
        { errorContainer: "#emailError" }
      )
      .addField(
        "#password",
        [
          { rule: "required", errorMessage: "Vui lòng nhập mật khẩu!" },
          {
            validator: (value: string) => value.length >= 8,
            errorMessage: "Mật khẩu có ít nhất 8 kí tự",
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
        {
          errorContainer: "#passwordError",
        }
      )
      .addField(
        "#agree",
        [{ rule: "required", errorMessage: "Vui lòng đồng ý với điều khoản!" }],
        {
          errorContainer: "#agreeError",
        }
      )
      .onSuccess((event: any) => {
        const fullName = event.target.fullName.value;
        const email = event.target.email.value;
        const password = event.target.password.value;

        const finalData = {
          fullName: fullName,
          email: email,
          password: password,
        };
        console.log(finalData);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(finalData),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log(data);
            if (data.code == "error") {
              toast.error(data.message);
            }

            if (data.code == "success") {
              toast.success(data.message);
              router.push(`/account/verify?email=${email}&type=register`);
            }

            if (data.code == "existedOTP") {
              toast.error(data.message);
              router.push(`/account/verify?email=${email}&type=register`);
            }
          });
      });
  }, []);

  return (
    <>
      <form id="registerForm">
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

          <div>
            <label className="flex items-center gap-2 mt-1">
              <input id="agree" type="checkbox" className="h-4 w-4" />
              <span>Tôi đồng ý với điều khoản</span>
            </label>
            <div
              id="agreeError"
              className="ml-7 mt-0.5 text-sm text-red-500"
            ></div>
          </div>

          <div className="mt-1 text-center">
            <button
              type="submit"
              className="h-10 w-[100px] rounded-lg bg-blue-500 font-bold text-white hover:bg-blue-600 cursor-pointer"
            >
              Đăng ký
            </button>
          </div>

          <div className="text-center text-sm">
            Bạn đã có tài khoản?
            <button
              type="button"
              className="pl-1 text-blue-500 font-[600] cursor-pointer hover:text-blue-700"
              onClick={() => router.push("/account/login")}
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
