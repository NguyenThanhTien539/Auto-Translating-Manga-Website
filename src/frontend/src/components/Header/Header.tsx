import Link from "next/link";
import Image from "next/image";
import { Lightbulb, Search, BookOpen } from "lucide-react";

export default function Header() {
  return (
    <>
      <header className="bg-neutral-900 text-white  py-[15px] px-[16px]">
        <div className="container mx-auto ">
          <div className="flex items-center gap-4">
            <Link href={"/"} className="flex items-center gap-2 ">
              <Image
                src={"/image/logo.jpg"}
                alt="logo"
                width={50}
                height={50}
              ></Image>
              <span className="text-2xl font-semibold tracking-wide">
                SOFTWARRIORS
              </span>
            </Link>

            <form action="" className="ml-[30px] flex-1">
              <div className="relative w-full max-w-lg">
                <Lightbulb
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-80"
                  size={20}
                />

                <input
                  type="text"
                  placeholder="Bạn muốn tìm truyện gì"
                  className="w-full h-10 rounded-full bg-neutral-800/80 border border-neutral-600/60 pl-10 pr-10 focus:border-transparent focus:ring-2 focus:ring-blue-600"
                />

                <button
                  type="submit"
                  aria-label="Tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-white cursor-pointer"
                >
                  <Search size={18} />
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3">
              <Link
                href={"/account/register"}
                className="rounded-2xl bg-blue-600 font-semibold px-4 py-2 hover:bg-blue-700"
              >
                Đăng ký
              </Link>
              <Link
                href={"/account/register"}
                className="rounded-2xl bg-blue-600 font-semibold px-4 py-2 hover:bg-blue-700"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
