"use client";

import type { CredentialResponse } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

const roleRedirectMap: Record<string, string> = {
  "0": "/admin/dashboard",
  "1": "/",
  "2": "/",
};

interface GoogleAuthResponse {
  code?: string;
  message?: string;
  role?: string;
}

interface UseGoogleAuthOptions {
  serverErrorMessage?: string;
}

export function useGoogleAuth(options?: UseGoogleAuthOptions) {
  const router = useRouter();

  const handleGoogleLogin = useCallback(
    async (googleUser: CredentialResponse) => {
      if (!googleUser.credential) {
        toast.error(
          options?.serverErrorMessage ?? "Google credential is missing",
        );
        return;
      }

      const dataFinal = {
        credential: googleUser.credential,
        rememberMe: true,
      };

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
        const data = (await res.json()) as GoogleAuthResponse;

        if (!res.ok) {
          throw new Error(
            data.message ?? options?.serverErrorMessage ?? "Server error",
          );
        }

        if (data.code === "error") {
          toast.error(
            data.message ??
              options?.serverErrorMessage ??
              "Đăng nhập Google thất bại",
          );
        } else if (data.code === "success") {
          toast.success(data.message ?? "Đăng nhập Google thành công");
          const target = roleRedirectMap[data.role ?? ""] ?? "/";
          router.push(target);
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : (options?.serverErrorMessage ?? "Server error"),
        );
      }
    },
    [options?.serverErrorMessage, router],
  );

  return { handleGoogleLogin };
}
