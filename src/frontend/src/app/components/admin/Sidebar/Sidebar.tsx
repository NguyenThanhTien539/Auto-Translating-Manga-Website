"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Clock,
  Grid3X3,
  Box,
  Users,
  User,
  Settings,
  UserCheck,
  LogOut,
} from "lucide-react";

const baseClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition";
const activeClass = "bg-blue-500 text-white";
const normalClass = "text-gray-800 hover:bg-gray-100";

export default function Sidebar() {
  const pathname = usePathname();

  const isCategoryActive = pathname.startsWith("/admin/category");

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
        href="/admin/category/list"
        className={`${baseClass} ${
          isCategoryActive ? activeClass : normalClass
        }`}
      >
        <Grid3X3 className="w-4 h-4" />
        <span>Quản lý thể loại</span>
      </Link>

      <Link
        href="/admin/product/list"
        className={`${baseClass} ${
          pathname === "/admin/product/list" ? activeClass : normalClass
        }`}
      >
        <Box className="w-4 h-4" />
        <span>Quản lý sản phẩm</span>
      </Link>

      <Link
        href="/admin/user/list"
        className={`${baseClass} ${
          pathname === "/admin/user/list" ? activeClass : normalClass
        }`}
      >
        <Users className="w-4 h-4" />
        <span>Quản lý người dùng</span>
      </Link>

      <Link
        href="/admin/contacts"
        className={`${baseClass} ${
          pathname === "/admin/contacts" ? activeClass : normalClass
        }`}
      >
        <User className="w-4 h-4" />
        <span>Thông tin liên hệ</span>
      </Link>

      {/* Bottom section */}
      <div className="my-3 -mx-3 border-b border-gray-300 " />

      {/* nhóm dưới */}
      <div className="space-y-1">
        <Link
          href="/admin/settings"
          className={`${baseClass} ${
            pathname === "/admin/settings" ? activeClass : normalClass
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cài đặt chung</span>
        </Link>

        <Link
          href="/admin/profile"
          className={`${baseClass} ${
            pathname === "/admin/profile" ? activeClass : normalClass
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Thông tin cá nhân</span>
        </Link>

        <Link
          href="/logout"
          className="flex items-center gap-3 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </Link>
      </div>
    </nav>
  );
}
