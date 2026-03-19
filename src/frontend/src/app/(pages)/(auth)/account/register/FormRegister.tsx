/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/user/register/page.tsx
"use client";
import JustValidate from "just-validate";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import MyCustomGoogleButton from "@/app/hooks/useGoogle";

export default function FormRegister() {
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleSuccessGoogleLogin = async (credentialResponse: any) => {
    const { credential } = credentialResponse;
    const dataFinal = { credential: credential, rememberPassword: false };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/account/google-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataFinal),
          credentials: "include",
        },
      );
      const data = await res.json();

      if (data.code === "error") {
        toast.error(data.message || "Google login failed");
      } else if (data.code === "success") {
        toast.success(data.message || "Login successful!");
        data.role === "0" ? router.push("/admin/dashboard") : router.push("/");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    }
  };

  useEffect(() => {
    const validation = new JustValidate("#registerForm", {
      validateBeforeSubmitting: true,
    });

    validation
      .addField(
        "#fullName",
        [
          { rule: "required", errorMessage: "Full name is required!" },
          {
            rule: "minLength",
            value: 5,
            errorMessage: "At least 5 characters!",
          },
          { rule: "maxLength", value: 50, errorMessage: "Max 50 characters!" },
        ],
        { errorContainer: "#fullNameError" },
      )
      .addField(
        "#email",
        [
          { rule: "required", errorMessage: "Email is required!" },
          { rule: "email", errorMessage: "Invalid email format!" },
        ],
        { errorContainer: "#emailError" },
      )
      .addField(
        "#password",
        [
          { rule: "required", errorMessage: "Password is required!" },
          {
            validator: (val: string) => val.length >= 8,
            errorMessage: "At least 8 characters",
          },
          {
            validator: (val: string) => /[A-Z]/.test(val),
            errorMessage: "Need one uppercase letter",
          },
          {
            validator: (val: string) => /[a-z]/.test(val),
            errorMessage: "Need one lowercase letter",
          },
          {
            validator: (val: string) => /\d/.test(val),
            errorMessage: "Need one number",
          },
          {
            validator: (val: string) => /[@$!%*?&]/.test(val),
            errorMessage: "Need one special character",
          },
        ],
        { errorContainer: "#passwordError" },
      )
      .addField(
        "#agree",
        [{ rule: "required", errorMessage: "You must agree to the terms!" }],
        { errorContainer: "#agreeError" },
      )
      .onSuccess(async (event: any) => {
        const formData = new FormData(event.target);
        const finalData = Object.fromEntries(formData.entries());

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

          if (data.code === "error") toast.error(data.message);
          else if (data.code === "success" || data.code === "existedOTP") {
            toast.success(data.message);
            router.push(
              `/account/verify?email=${finalData.email}&type=register`,
            );
          }
        } catch (error) {
          toast.error("Registration failed. Please try again.");
        }
      });
  }, [router]);

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
              Full Name*
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="e.g. John Doe"
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
              Email*
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="e.g. john@example.com"
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
              Password*
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="******"
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
              <span className="text-[14px]">
                I agree to the Terms and Conditions
              </span>
            </label>
            <div id="agreeError" className="text-sm text-red-500 mt-1"></div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-[#1B6FAB] hover:bg-[#155a8a] transition-colors rounded-lg w-full h-[48px] font-[700] text-[16px] text-white"
          >
            Sign up
          </button>

          {/* Divider */}
          <div className="flex gap-2 items-center justify-between my-2">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-gray-500 text-[12px]">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Google Login Section */}
          <div className="flex justify-center w-full">
            <GoogleOAuthProvider
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
              locale="en"
            >
              <MyCustomGoogleButton onSuccess={handleSuccessGoogleLogin} />
            </GoogleOAuthProvider>
          </div>

          {/* Footer Link */}
          <div className="text-center text-[14px] mt-2 space-y-5">
            <div>
              Already have an account?
              <button
                type="button"
                className="pl-1 text-blue-600 font-[600] hover:underline"
                onClick={() => router.push("/account/login")}
              >
                Login
              </button>
            </div>
            <div>
              Go back to
              <button
                type="button"
                className="pl-1 text-blue-600 font-[600] hover:underline"
                onClick={() => router.push("/")}
              >
                homepage?
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
