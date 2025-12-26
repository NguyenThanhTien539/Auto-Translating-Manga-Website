"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Clock,
  Grid3X3,
  Box,
  Users,
  User,
  LogOut,
  PenTool,
} from "lucide-react";

const baseClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition";
const activeClass = "bg-blue-500 text-white";
const normalClass = "text-gray-800 hover:bg-gray-100";

export default function Sidebar() {
  const pathname = usePathname();
  const route = useRouter();
  const isCategoryActive = pathname.startsWith("/admin/genre");
  const isMangaActive = pathname.startsWith("/admin/manage-manga");
  const isAuthorActive = pathname.startsWith("/admin/manage-authors");
  const isRegistrationActive = pathname.startsWith("/admin/registration");
  const isUserActive = pathname.startsWith("/admin/manage-users");

  const   handleLogout = async (url: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.code == "success") {
        route.push(url);
        toast.success(data.message || "Đăng xuất thành công");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đăng xuất");
    } finally {
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code == "success") {
          route.push(url);
          toast.success(data.message || "Đăng xuất thành công");
        }
      });
  };
  return (
    <nav className="p-3 space-y-3 min-w-[230px]  border-r border-gray-300">
      <Link
        href="/admin/dashboard"
        className={`${baseClass} ${
          pathname === "/admin/dashboard" ? activeClass : normalClass
        }`}
      >
        <Clock className="w-4 h-4" />
        <span>Tổng quan</span>
      </Link>

      <Link
        href="/admin/genre/list"
        className={`${baseClass} ${
          isCategoryActive ? activeClass : normalClass
        }`}
      >
        <Grid3X3 className="w-4 h-4" />
        <span>Quản lý thể loại</span>
      </Link>

      <Link
        href="/admin/manage-manga"
        className={`${baseClass} ${isMangaActive ? activeClass : normalClass}`}
      >
        <Box className="w-4 h-4" />
        <span>Quản lý Manga</span>
      </Link>

      <Link
        href="/admin/manage-authors"
        className={`${baseClass} ${isAuthorActive ? activeClass : normalClass}`}
      >
        <PenTool className="w-4 h-4" />
        <span>Quản lý tác giả</span>
      </Link>

      <Link
        href="/admin/registration/list"
        className={`${baseClass} ${
          isRegistrationActive ? activeClass : normalClass
        }`}
      >
        <Users className="w-4 h-4" />
        <span>Quản lý form đăng ký </span>
      </Link>

      <Link
        href="/admin/manage-users"
        className={`${baseClass} ${isUserActive ? activeClass : normalClass}`}
      >
        <User className="w-4 h-4" />
        <span>Thông tin người dùng</span>
      </Link>

      {/* Logout Button */}
      <button
        onClick={() => handleLogout("/")}
        className={`${baseClass} ${normalClass} w-full text-left cursor-pointer `}
      >
        <LogOut className="w-4 h-4" />
        <span>Đăng xuất</span>
      </button>
    </nav>
  );
}
