/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import JustValidate from "just-validate";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import MyCustomGoogleButton from "@/app/hooks/useGoogle";

const roleRedirectMap: Record<string, string> = {
  0: "/admin/dashboard",
  1: "/",
  2: "/",
};

export default function FormLogin() {
  const router = useRouter();
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
    const validate = new JustValidate("#loginForm", { lockForm: false });

    validate
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
        [{ rule: "required", errorMessage: "Password is required!" }],
        { errorContainer: "#passwordError" },
      )
      .onSuccess((event: any) => {
        const email = event.target.email.value;
        const password = event.target.password.value;
        const rememberPassword = event.target.rememberPassword.checked;

        const dataFinal = {
          email,
          password,
          rememberPassword,
        };

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/account/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataFinal),
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.code == "error") {
              toast.error(data.message || "Login failed!");
            }
            if (data.code == "success") {
              toast.success("Login successful!");
              const role = data.role as string;
              const target = roleRedirectMap[role] ?? "/";
              router.push(target);
            }
          });
      });
  }, [router]);

  return (
    <div className="max-w-md mx-auto p-4">
      <form id="loginForm">
        <div className="flex flex-col gap-4 mt-[25px]">
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
                Remember me
              </label>
            </div>
            <button
              type="button"
              className="text-blue-500 font-[600] hover:underline"
              onClick={() => router.push("/account/forgot-password")}
            >
              Recovery password
            </button>
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            className="bg-[#1B6FAB] hover:bg-[#155a8a] transition-colors rounded-lg w-full h-[48px] font-[700] text-[16px] text-white"
          >
            Log in
          </button>

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
              <span>Don&apos;t have an account?</span>
              <button
                type="button"
                className="pl-1 text-blue-600 font-[600] hover:underline"
                onClick={() => router.push("/account/register")}
              >
                Sign up
              </button>
            </div>
            <div>
              Go back to
              <button
                type="button"
                className="pl-1 text-blue-600 font-[600] hover:underline"
                onClick={() => router.push("/")}
              >
                home page
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
