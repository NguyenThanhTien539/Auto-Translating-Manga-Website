/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/user/register/page.tsx
"use client";
import JustValidate from "just-validate";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import MyCustomGoogleButton from "@/app/components/auth/MyCustomGoogleButton";
import { useGoogleAuth } from "@/app/hooks/useGoogleAuth";

import { useTranslations } from "next-intl";

export default function FormRegister() {
  const router = useRouter();
  const t = useTranslations("RegisterPage");
  const v = useTranslations("Validation");

  const { handleGoogleLogin } = useGoogleAuth({
    serverErrorMessage: v("serverError"),
  });
  useEffect(() => {
    const validation = new JustValidate("#registerForm", {
      validateBeforeSubmitting: true,
    });

    validation
      .addField(
        "#fullName",
        [
          { rule: "required", errorMessage: v("fullNameRequired") },
          {
            rule: "minLength",
            value: 5,
            errorMessage: v("fullNameMinLength"),
          },
          {
            rule: "maxLength",
            value: 50,
            errorMessage: v("fullNameMaxLength"),
          },
        ],
        { errorContainer: "#fullNameError" },
      )
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
        [
          { rule: "required", errorMessage: v("passwordRequired") },
          {
            validator: (val: string) => val.length >= 8,
            errorMessage: v("passwordMinLength"),
          },
          {
            validator: (val: string) => /[A-Z]/.test(val),
            errorMessage: v("passwordUppercase"),
          },
          {
            validator: (val: string) => /[a-z]/.test(val),
            errorMessage: v("passwordLowercase"),
          },
          {
            validator: (val: string) => /\d/.test(val),
            errorMessage: v("passwordNumber"),
          },
          {
            validator: (val: string) => /[@$!%*?&]/.test(val),
            errorMessage: v("passwordSpecial"),
          },
        ],
        { errorContainer: "#passwordError" },
      )
      .addField(
        "#agree",
        [{ rule: "required", errorMessage: v("agreeRequired") }],
        { errorContainer: "#agreeError" },
      )
      .onSuccess(async (event: any) => {
        const finalData = {
          full_name: event.target.fullName.value,
          email: event.target.email.value,
          password: event.target.password.value,
          agree: event.target.agree.checked,
        };

        console.log("Validated data:", finalData);
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/account/register`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(finalData),
            },
          );
          const data = await res.json();

          if (!data.success) {
            toast.error(data.message);
          } else {
            toast.success(data.message);
            router.push(
              `/account/verify?email=${finalData.email}&type=register`,
            );
          }
        } catch (error) {
          toast.error(v("registerFailed"));
        }
      });
  }, [router, v]);

  return (
    <div className="max-w-md mx-auto p-4">
      <form id="registerForm">
        <div className="flex flex-col gap-4 mt-[25px]">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block font-[500] text-[14px] mb-[5px]"
            >
              {t("fullName")}
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder={t("fullNamePlaceholder")}
              className="border border-gray-400 rounded-lg p-2 w-full focus:outline-blue-500"
            />
            <div id="fullNameError" className="text-sm text-red-500 mt-1"></div>
          </div>

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

          {/* Terms */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                id="agree"
                name="agree"
                type="checkbox"
                className="w-4 h-4"
              />
              <span className="text-[14px]">{t("agreeTerms")}</span>
            </label>
            <div id="agreeError" className="text-sm text-red-500 mt-1"></div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-[#1B6FAB] hover:bg-[#155a8a] transition-colors rounded-lg w-full h-[48px] font-[700] text-[16px] text-white"
          >
            {t("signUpButton")}
          </button>

          {/* Divider */}
          <div className="flex gap-2 items-center justify-between my-2">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-gray-500 text-[12px]">{t("or")}</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Google Login Section */}
          <div className="flex justify-center w-full">
            <GoogleOAuthProvider
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
              locale="en"
            >
              <MyCustomGoogleButton onSuccess={handleGoogleLogin} />
            </GoogleOAuthProvider>
          </div>

          {/* Footer Link */}
          <div className="text-center text-[14px] mt-2 space-y-5">
            <div>
              {t("haveAccount")}
              <button
                type="button"
                className="pl-1 text-blue-600 font-[600] hover:underline"
                onClick={() => router.push("/account/login")}
              >
                {t("login")}
              </button>
            </div>
            <div>
              {t("goBack")}
              <button
                type="button"
                className="pl-1 text-blue-600 font-[600] hover:underline"
                onClick={() => router.push("/")}
              >
                {t("homePage")}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
