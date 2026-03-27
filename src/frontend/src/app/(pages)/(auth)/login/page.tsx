import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";
import Image from "next/image";
import FormLogin from "./FormLogin";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const language = cookieStore.get("NEXT_LOCALE")?.value || "vi";
  let messages;
  try {
    messages = (await import(`@/messages/${language}.json`)).default; 
  } catch (error) {
    messages = (await import(`@/messages/vi.json`)).default;
  }

  const t = (key: string) => messages.LoginPage?.[key] || key;

  return (
    <NextIntlClientProvider locale={language} messages={messages}>
      <main className="min-h-screen flex">
        <div className="w-full lg:w-2/3 flex items-center justify-center px-4 bg-white">
          <div className="w-full max-w-[450px]">
            <div className="mb-[30px] flex text-center flex-col items-center gap-2">
              <h1 className="text-[40px] font-semibold mb-[20px] text-blue-400">
                Yuki
              </h1>
              <div className="text-[32px] text-gray-600 mb-[3px] leading-none">
                <span>{t("welcome")}</span>
                <span className="text-blue-500 font-[600]">{t("back")}</span>
              </div>
              <p className="text-[12px] text-gray-500 font-semibold text-center">
                {t("description")}
              </p>
            </div>

            <FormLogin />
          </div>
        </div>
        t{" "}
        <div className="w-1/3 relative hidden lg:block">
          <Image
            src="/image/backgroud_account.png"
            alt="Background image"
            fill
            className="object-cover"
            priority
            sizes="33vw"
          />
        </div>
      </main>
    </NextIntlClientProvider>
  );
}
