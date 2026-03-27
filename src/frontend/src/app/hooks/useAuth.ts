import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/app/utils/api";

interface AuthUserPayload {
  user?: unknown;
  banned?: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [infoUser, setInfoUser] = useState<any>(null);

  const pathName = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    api
      .get<AuthUserPayload>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/check`,
      )
      .then((data) => {
        const userFromResponse = data.data?.user ?? null;
        const isSuccess = data.success === true;
        const isBanned = data.data?.banned === true;

        if (isSuccess && userFromResponse) {
          setIsLogin(true);
          setInfoUser(userFromResponse);
        } else {
          setIsLogin(false);
          setInfoUser(null);
        }

        if (isBanned) {
          setIsLogin(false);
          setInfoUser(null);
          toast.error("Tài khoản của bạn đã bị khóa.");
          router.push("/");
        }
      })
      .catch(() => {
        setIsLogin(false);
        setInfoUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [pathName, router]);
  return { infoUser, isLogin, isLoading };
}
