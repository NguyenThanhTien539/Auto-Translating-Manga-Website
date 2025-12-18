import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
export function useAuth() {
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [infoUser, setInfoUser] = useState<any>(null);

  const pathName = usePathname();

  useEffect(() => {
    setIsLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (data.code == "success") {
          setIsLogin(true);
          setInfoUser(data.infoUser);
        }

        if (data.code == "error") {
          setIsLogin(false);
          setInfoUser(null);
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
