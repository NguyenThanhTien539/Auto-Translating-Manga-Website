/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { BookOpen, Plus, Edit3, Trash2, LayoutGrid, Clock } from "lucide-react";
import Link from "next/link";

export default function ManagePage() {
  const [myMangas, setMyMangas] = useState<any[]>([]);
  const { infoUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMangas = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/manga/my-mangas`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        if (data.code === "success") {
          setMyMangas(data.data);
        }
      } catch (err) {
        console.error("Lỗi fetch manga:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (infoUser) fetchMangas();
  }, [infoUser]);

  // Bảo vệ app khỏi lỗi null property
  if (!infoUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const renderUploaderView = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Quản Lý Truyện Đã Đăng
          </h2>
          <p className="text-gray-500 text-sm">
            Bạn đang có {myMangas.length} tác phẩm trên hệ thống
          </p>
        </div>
        <Link
          href="/profile/upload-manga"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <Plus size={18} />
          Đăng Truyện Mới
        </Link>
      </div>

      {myMangas.length === 0 && !isLoading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Chưa có truyện nào
          </h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">
            Bắt đầu hành trình tác giả của bạn bằng cách đăng tải bộ truyện đầu
            tiên.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myMangas.map((manga) => (
            <div
              key={manga.id}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-100 transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <LayoutGrid size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 text-gray-500 rounded-md">
                    ID: {manga.id}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-xl mb-2 truncate group-hover:text-blue-600 transition-colors">
                  {manga.title}
                </h3>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>Vừa cập nhật</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-50">
                <button className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                  <Edit3 size={16} />
                  Sửa
                </button>
                <button className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100 rotate-3">
              {infoUser.full_name?.charAt(0) || "U"}
            </div>

            <div className="text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-2 mb-1">
                <h1 className="text-3xl font-black text-gray-900">
                  {infoUser.full_name}
                </h1>
                <span className="px-3 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full tracking-widest border border-blue-200">
                  {infoUser.role === "Uploader" ? "Người tải lên" : "Độc Giả"}
                </span>
              </div>
              <p className="text-gray-500 font-medium">{infoUser.email}</p>
            </div>
          </div>
        </div>

        {/* Content View */}
        {renderUploaderView()}
      </div>
    </div>
  );
}
