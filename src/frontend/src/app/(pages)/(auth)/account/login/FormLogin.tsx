/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import JustValidate from "just-validate";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";



export default function FormLogin() {
  const router = useRouter();

  useEffect(() => {
    const validate = new JustValidate("#loginForm", { lockForm: false });

    validate
      .addField(
        "#email",
        [
          { rule: "required", errorMessage: "Vui lòng nhập email!" },
          { rule: "email", errorMessage: "Email không đúng định dạng" },
        ],
        { errorContainer: "#emailError" }
      )
      .addField(
        "#password",
        [{ rule: "required", errorMessage: "Vui lòng nhập mật khẩu!" }],
        { errorContainer: "#passwordError" }
      )
      .onSuccess((event: any) => {
        const email = event.target.email.value;
        const password = event.target.password.value;
        const rememberPassword = event.target.rememberPassword.checked;

        const dataFinal = {
          email: email,
          password: password,
          rememberPassword: rememberPassword,
        };

        console.log(dataFinal);

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataFinal),
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.code == "error") {
              toast.error("Đăng nhập thất bại");
            }

            if (data.code == "success") {
              router.push(`/`);
              toast.success("Đăng nhập thành công!");
            }
          });
      });
  }, []);

  return (
    <>
      <form id="loginForm" action="">
        <div className="flex flex-col gap-4 mt-[25px]">
          <div>
            <label className="block font-[500] text-[14px] mb-[5px]">
              Email*
            </label>
            <input
              type="text"
              id="email"
              placeholder="Ví dụ: nva@gmail.com"
              className="border border-gray-500 rounded-lg p-2 w-full  "
            />
            <div id="emailError" className="text-sm text-red"></div>
          </div>
          <div>
            <label className="block font-[500] text-[14px] mb-[5px]">
              Mật khẩu*
            </label>
            <input
              type="password"
              id="password"
              placeholder="******"
              className="border border-gray-[500] rounded-lg p-2 w-full  "
            />
            <div id="passwordError" className="text-sm text-red"></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberPassword"
                type="checkbox"
                className="w-[20px] h-[20px]"
              />
              <label htmlFor="rememberPassword" className="ml-[10px]">
                Nhớ mật khẩu
              </label>
            </div>
            <span
              className="text-blue-500 cursor-pointer"
              onClick={() => {
                router.push("/account/forgot-password");
              }}
            >
              Quên mật khẩu
            </span>
          </div>

          <div className="text-center mt-[2px]">
            <button
              className=" bg-blue-500 border border-[#DEDEDE] rounded-lg w-[100px] h-[40px] font-[700] text-[16px] text-white cursor-pointer"
              type="submit"
            >
              Đăng nhập
            </button>
          </div>

          <div className="text-center text-[14px]">
            Bạn chưa có tài khoản?
            <span
              className="pl-1 text-blue-500 font-[600] cursor-pointer hover:text-blue-700"
              onClick={() => {
                router.push("/account/register");
              }}
            >
              Tạo tài khoản
            </span>
          </div>
        </div>
      </form>
    </>
  );
}
