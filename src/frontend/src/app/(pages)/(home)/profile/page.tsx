"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import {
  LogOut,
  Upload,
  Settings,
  Edit2,
  Mail,
  Award,
  BookOpen,
  Heart,
  CheckCircle,
  FileText,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { finished } from "stream";
import { read } from "fs";

export default function ProfilePage() {
  const { infoUser, isLoading } = useAuth();
  const router = useRouter();
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [statistics, setStatistics] = useState<{
    reading: number;
    finished: number;
    favorite: number;
    totalChapters: number;
  } | null>(null);

  const handleLogout = async (url: string) => {
    setLoadingLogout(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.code == "success") {
        router.push(url);
        toast.success(data.message || "Đăng xuất thành công");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đăng xuất");
    } finally {
      setLoadingLogout(false);
    }
  };

  const entries = [
    {
      key: "Đang đọc",
      value: statistics?.reading ?? 0,
      color: "#60a5fa",
      icon: BookOpen,
    },
    {
      key: "Hoàn thành",
      value: statistics?.finished ?? 0,
      color: "#34d399",
      icon: CheckCircle,
    },
    {
      key: "Yêu thích",
      value: statistics?.favorite ?? 0,
      color: "#fb7185",
      icon: Heart,
    },
  ];

  const total = entries.reduce((s, e) => s + e.value, 0) || 1;

  let acc = 0;
  const gradientParts = entries.map((e) => {
    const start = (acc / total) * 100;
    acc += e.value;
    const end = (acc / total) * 100;
    return `${e.color} ${start}% ${end}%`;
  });

  useEffect(() => {
    if (!infoUser) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/statistics`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setStatistics({
            reading: data.data.reading_count || 0,
            finished: data.data.finished_count || 0,
            favorite: data.data.favoriteCount || 0,
            totalChapters: data.data.finished_count + data.data.reading_count,
          });
        } else {
          setStatistics({
            reading: 0,
            finished: 0,
            favorite: 0,
            totalChapters: 0,
          });
        }
      })
      .catch((error) => {
        console.error("Lỗi khi lấy thống kê truyện:", error);
        setStatistics({
          reading: 0,
          finished: 0,
          favorite: 0,
          totalChapters: 0,
        });
      });
  }, [infoUser]);

  return (
    <>
      {isLoading || !statistics ? (
        <div className="w-full min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="w-full min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header with gradient background */}
            <div className="relative h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              <div className="absolute -bottom-16 left-8">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-lg">
                  {infoUser?.avatar ? (
                    <Image
                      src={infoUser.avatar}
                      alt="avatar"
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-700 bg-gradient-to-br from-blue-100 to-purple-100">
                      {infoUser?.username?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="pt-20 px-8 pb-8">
              {/* User Info */}
              <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {infoUser?.username ?? "Người dùng"}
                      </h1>
                      <button
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        onClick={() => {
                          router.push(`/profile/detail`);
                        }}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} className="text-gray-500" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} className="text-blue-500" />
                        <span>{infoUser?.email ?? "email@example.com"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                          <Award size={14} className="text-purple-600" />
                          <span className="text-xs font-semibold text-purple-700">
                            {infoUser?.role === "Uploader"
                              ? "Uploader"
                              : infoUser?.role === "Admin"
                              ? "Quản trị viên"
                              : "Độc giả"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons based on role */}
                <div className="flex flex-wrap gap-3">
                  {infoUser?.role === "Uploader" ? (
                    <>
                      <button
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all"
                        onClick={() => router.push("/profile/upload-manga")}
                      >
                        <Upload size={16} />
                        Đăng truyện mới
                      </button>
                      <button
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all"
                        onClick={() => router.push("/profile/manage-manga")}
                      >
                        <Settings size={16} />
                        Quản lý truyện
                      </button>
                    </>
                  ) : infoUser?.role === "Reader" ? (
                    <button
                      className=" cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all"
                      onClick={() => router.push("/profile/register-uploader")}
                    >
                      <FileText size={16} />
                      Đăng ký trở thành Uploader
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Stats Section */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen size={20} className="text-blue-500" />
                  Thống kê đọc truyện
                </h2>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                  {/* Legend */}
                  <div className="w-full lg:w-auto space-y-3">
                    {entries.map((e) => {
                      const Icon = e.icon;
                      return (
                        <div
                          key={e.key}
                          className="flex items-center justify-between gap-4 bg-white rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              style={{ background: e.color }}
                              className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                            >
                              <Icon size={18} className="text-white" />
                            </div>
                            <span className="font-medium text-gray-700">
                              {e.key}
                            </span>
                          </div>
                          <span
                            className="text-xl font-bold"
                            style={{ color: e.color }}
                          >
                            {e.value}
                          </span>
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg px-4 py-3 shadow-md text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <BookOpen size={18} />
                        </div>
                        <span className="font-medium">Tổng chương đã đọc</span>
                      </div>
                      <span className="text-xl font-bold">
                        {statistics.totalChapters}
                      </span>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="w-52 h-52 rounded-full shadow-lg border-4 border-white"
                      style={{
                        background: `conic-gradient(${gradientParts.join(
                          ", "
                        )})`,
                      }}
                    />
                    <p className="text-sm text-gray-500 font-medium"></p>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="flex justify-end">
                <button
                  className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleLogout("/")}
                  disabled={loadingLogout}
                >
                  {loadingLogout ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <LogOut size={16} />
                  )}
                  {loadingLogout ? "Đang đăng xuất..." : "Đăng xuất"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
