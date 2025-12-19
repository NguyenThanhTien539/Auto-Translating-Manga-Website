// src/components/Sidebar/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { User, Heart, Home, Compass, PenSquare, Bell } from "lucide-react";
const MAIN_MENU = [
  { label: "Trang chủ", href: "/", icon: Home },
  { label: "Khám phá", href: "/explore", icon: Compass },
  { label: "Tác giả", href: "/authors", icon: PenSquare },
  { label: "Thông báo", href: "/notifications", icon: Bell },
];

const SECOND_MENU = [
  { label: "Hồ sơ", href: "/profile", icon: User },
  { label: "Danh sách của tôi", href: "/favourite-list", icon: Heart },
];

export default function Sidebar() {
  const { infoUser, isLogin } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="w-[210px] bg-sky-900 text-white flex-shrink-0">
      <div className="flex h-full flex-col justify-start py-6 gap-10">
        {/* Menu chính */}
        <div className="px-4 space-y-4">
          <div className="text-xs uppercase tracking-wide text-sky-200 mb-2">
            MENU
          </div>
          <nav className="flex flex-col gap-2">
            {MAIN_MENU.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                    isActive
                      ? "bg-[#F4B333] text-black" //F4B333
                      : "hover:text-blue-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Menu dưới (Tổng quan / Cài đặt) */}
        {isLogin ? (
          <>
            <div className="px-4 pb-2">
              <div className="text-xs uppercase tracking-wide text-sky-200 mb-2">
                TỔNG QUAN
              </div>
              <nav className="flex flex-col gap-2">
                {SECOND_MENU.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                        isActive
                          ? "bg-[#F4B333] text-black"
                          : "hover:text-blue-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        ) : (
          <></>
        )}
      </div>
    </aside>
  );
}
