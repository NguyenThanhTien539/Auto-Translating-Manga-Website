
import Link from "next/link";
import Image from "next/image";
import { Lightbulb, Search } from "lucide-react";

export default function TopHeader() {
  return (
    <header className="bg-neutral-900 text-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* Thay src logo của bạn */}
            {/* <Image
              src="/logo.png"
              alt="TRUYENQQ"
              width={32}
              height={32}
              className="rounded"
            /> */}
            <span className="text-xl font-semibold tracking-wide ">
              TRUYENQQ
            </span>
          </Link>

          {/* Search (giữa) */}
          <form className="relative flex-1">
            {/* icon trái */}
            <Lightbulb
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-80"
              size={18}
            />
            {/* input */}
            <input
              placeholder="Bạn muốn tìm truyện gì"
              className="w-full rounded-full bg-neutral-800/80 border border-neutral-600/60
                         pl-10  h-11 outline-none
                         placeholder:text-neutral-400
                         focus:border-transparent focus:ring-2 focus:ring-blue-600"
            />
            {/* icon search phải */}
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5
                         hover:bg-neutral-700/60 transition"
              aria-label="Tìm kiếm"
            >
              <Search size={18} />
            </button>
          </form>

          {/* Actions (phải) */}
          <div className="flex items-center gap-3">
            <Link
              href="/account/register"
              className="rounded-xl bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700"
            >
              Đăng ký
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
