import FormRegister from "./FormRegister";
import Image from "next/image";

export default function UserLoginPage() {
  return (
    <>
      <div className="fixed inset-0 ">
        <Image
          src="/bg-account.svg"
          alt="Hình nền"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>

      <main className="relative z-10 min-h-screen grid place-items-center px-4">
        <div className="w-full max-w-[500px] rounded-[10px] border border-[#DEDEDE] bg-white px-[20px] py-[50px]">
          <h1 className="text-center text-[30px] font-[600]">Đăng ký</h1>
          <FormRegister />
        </div>
      </main>
    </>
  );
}
