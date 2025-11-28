import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
export function useAuth() {
  const [isLogin, setIsLogin] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [infoUser, setInfoUser] = useState<any>(null);

  const pathName = usePathname();

  useEffect(() => {
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
        }
      });
  }, [pathName]);
  return { infoUser, isLogin };
}
