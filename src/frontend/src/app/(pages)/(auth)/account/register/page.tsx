import FormRegister from "./FormRegister";
import Image from "next/image";

export default function UserRegisterPage() {
  return (
    <>
      <main className="min-h-screen flex">
        <div className="w-2/3 flex items-center justify-center px-4 bg-white">
          <div className="w-full max-w-[450px]">
            <div className="mb-[30px] flex text-center flex-col items-center gap-2">
              <h1 className="text-[40px]  font-semibold mb-[20px] text-blue-400">
                Yuki
              </h1>
              <div className="text-[32px] text-gray-600 mb-[3px] line-height-[100%]">
                <span>Welcome </span>
                <span className="text-blue-500 font-[600]">back!</span>
              </div>
              <p className="text-[12px] text-gray-500 font-semibold">
                Discover manga, monitor and maintain, track your progress, have
                fun with our community
              </p>
            </div>
            <FormRegister />
          </div>
        </div>

        <div className="w-1/2 relative hidden lg:block">
          <Image
            src="/image/backgroud_account.png"
            alt="Hình nền"
            fill
            className="object-cover"
            priority
            sizes="50vw"
          />
        </div>
      </main>
    </>
  );
}
