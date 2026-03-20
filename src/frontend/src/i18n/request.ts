import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

type SupportedLocale = "en" | "vi";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value ||
    "vi") as SupportedLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
