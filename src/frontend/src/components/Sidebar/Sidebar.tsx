// src/components/Sidebar/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MAIN_MENU = [
  { label: "Trang chủ", href: "/", icon: "🏠" },
  { label: "Khám phá", href: "/explore", icon: "🔍" },
  { label: "Tác giả", href: "/authors", icon: "✒️" },
  { label: "Thông báo", href: "/notifications", icon: "🔔" },
];

const SECOND_MENU = [
  { label: "Tổng quan", href: "/overview", icon: "📊" },
  { label: "Cài đặt", href: "/settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const renderItem = (item: { label: string; href: string; icon: string }) => {
    const isActive =
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors
          ${
            isActive
              ? "bg-amber-400 text-slate-900 shadow-sm"
              : "text-slate-100 hover:bg-sky-700/70"
          }`}
      >
        <span className="text-base">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    // Sidebar cố định chiều rộng, cao = 100% phần dưới header
    <aside className="w-[210px] bg-sky-900 text-white flex-shrink-0">
      <div className="flex h-full flex-col justify-start py-6 gap-10">
        {/* Menu chính */}
        <div className="px-4 space-y-4">
          <div className="text-xs uppercase tracking-wide text-sky-200 mb-2">
            MENU -
          </div>
          <nav className="flex flex-col gap-2">{MAIN_MENU.map(renderItem)}</nav>
        </div>

        {/* Menu dưới (Tổng quan / Cài đặt) */}
        <div className="px-4 pb-2">
          <div className="text-xs uppercase tracking-wide text-sky-200 mb-2">
            TỔNG QUAN
          </div>
          <nav className="flex flex-col gap-2">
            {SECOND_MENU.map(renderItem)}
          </nav>
        </div>
      </div>
    </aside>
  );
}
