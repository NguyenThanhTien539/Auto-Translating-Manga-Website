"use client";

import Image from "next/image";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between px-10 border-b bg-white shadow-sm">
      <a
        href="/admin/dashboard"
        className="text-2xl font-semibold text-blue-600"
      >
        Admin
      </a>

      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full overflow-hidden">
          <Image
            src="/image/avatar.jpg"
            alt="Avatar"
            width={40}
            height={40}
            className="object-cover"
          />
        </div>

        <div className="flex flex-col leading-tight">
          <span className="font-semibold">Thanh Tiến</span>
          <span className="text-sm text-gray-500">Quản trị viên</span>
        </div>
      </div>
    </header>
  );
}
