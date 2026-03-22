/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import JustValidate from "just-validate";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import MyCustomGoogleButton from "@/app/components/auth/MyCustomGoogleButton";
import { useGoogleAuth } from "@/app/hooks/useGoogleAuth";
import { useTranslations, useLocale } from "next-intl";

const roleRedirectMap: Record<string, string> = {
  "0": "/admin/dashboard",
  "1": "/",
  "2": "/",
};

export default function FormLogin() {
  const router = useRouter();
  const t = useTranslations("LoginPage");
  const v = useTranslations("Validation");
  const locale = useLocale(); // Lấy ngôn ngữ hiện tại từ Provider
  const { handleGoogleLogin } = useGoogleAuth({
    serverErrorMessage: v("serverError"),
  });

  useEffect(() => {
    const validate = new JustValidate("#loginForm", { lockForm: false });

    validate
      .addField(
        "#email",
        [
          { rule: "required", errorMessage: v("emailRequired") },
          { rule: "email", errorMessage: v("emailInvalid") },
        ],
        { errorContainer: "#emailError" },
      )
      .addField(
        "#password",
        [{ rule: "required", errorMessage: v("passwordRequired") }],
        { errorContainer: "#passwordError" },
      )
      .onSuccess(async (event: any) => {
        const email = event.target.email.value;
        const password = event.target.password.value;
        const rememberPassword = event.target.rememberPassword.checked;

        const dataFinal = { email, password, rememberPassword };

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/account/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(dataFinal),
              credentials: "include",
            },
          );
          const data = await res.json();

          if (data.code === "error") {
            toast.error(data.message || v("loginFailed"));
          } else if (data.code === "success") {
            toast.success(v("loginSuccess"));
            const role = data.role as string;
            const target = roleRedirectMap[role] ?? "/";
            router.push(target);
          }
        } catch {
          toast.error(v("serverError"));
        }
      });

    // Cleanup khi component unmount hoặc locale thay đổi
    return () => {
      validate.destroy();
    };
  }, [router, v, locale]); // Thêm locale vào deps để update thông báo lỗi khi đổi ngôn ngữ

  return (
    <>
      <form id="loginForm">
        <div className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block font-[500] text-[14px] mb-[5px]"
            >
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              className="border border-gray-400 rounded-lg p-2 w-full focus:outline-blue-500"
            />
            <div id="emailError" className="text-sm text-red-500 mt-1"></div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block font-[500] text-[14px] mb-[5px]"
            >
              {t("password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              className="border border-gray-400 rounded-lg p-2 w-full focus:outline-blue-500"
            />
            <div id="passwordError" className="text-sm text-red-500 mt-1"></div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberPassword"
                name="rememberPassword"
                type="checkbox"
                className="w-4 h-4"
              />
              <label
                htmlFor="rememberPassword"
                className="ml-[10px] text-[14px]"
              >
                {t("rememberMe")}
              </label>
            </div>
            <button
              type="button"
              className="text-blue-500 font-[600] hover:underline text-[14px]"
              onClick={() => router.push("/account/forgot-password")}
            >
              {t("recoveryPassword")}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-[#1B6FAB] hover:bg-[#155a8a] transition-colors rounded-lg w-full h-[48px] font-[700] text-[16px] text-white"
          >
            {t("loginButton")}
          </button>

          <div className="flex justify-center w-full">
            <GoogleOAuthProvider
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
              locale={locale}
            >
              <MyCustomGoogleButton onSuccess={handleGoogleLogin} />
            </GoogleOAuthProvider>
          </div>

          {/* Footer Link */}
          <div className="text-center text-[14px] mt-2 space-y-3">
            <div>
              <span>{t("noAccount")}</span>
              <button
                type="button"
                className="pl-1 text-blue-600 font-[600] hover:underline"
                onClick={() => router.push("/account/register")}
              >
                {t("signUp")}
              </button>
            </div>
            <div>
              {t("goBack")}{" "}
              <button
                type="button"
                className="text-blue-600 font-[600] hover:underline"
                onClick={() => router.push("/")}
              >
                {t("homePage")}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
