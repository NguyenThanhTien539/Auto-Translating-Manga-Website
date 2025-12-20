import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code == "success") {
          setIsLogin(true);
          setInfoUser(data.infoUser);
        }

        if (data.code == "error") {
          setIsLogin(false);
          setInfoUser(null);
        }

        if (data.code == "ban") {
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
  }, [pathName]);
  return { infoUser, isLogin, isLoading };
}
