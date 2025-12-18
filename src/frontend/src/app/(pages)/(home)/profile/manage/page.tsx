"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, Upload, Settings, Plus } from "lucide-react";
import Link from "next/link";

export default function ManagePage() {
  const { infoUser, isLoading } = useAuth();
  const router = useRouter();
  const [myMangas, setMyMangas] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !infoUser) {
      router.push("/account/login");
    }
  }, [isLoading, infoUser, router]);

  // Fetch mangas if user is Uploader
  useEffect(() => {
    if (infoUser?.role === "Uploader") {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/my-mangas`, {
        credentials: "include"
      })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setMyMangas(data.data);
        }
      })
      .catch(err => console.error(err));
    }
  }, [infoUser]);

  if (isLoading || !infoUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  const renderUploaderView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản Lý Truyện Đã Đăng</h2>
        <Link 
          href="/profile/upload-manga" 
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Đăng Truyện Mới
        </Link>
      </div>

      {myMangas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có truyện nào</h3>
          <p className="mt-1 text-sm text-gray-500">Bắt đầu chia sẻ truyện của bạn ngay hôm nay.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myMangas.map((manga) => (
            <div key={manga.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <h3 className="font-bold text-lg mb-2 truncate">{manga.title}</h3>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>ID: {manga.id}</span>
                  {/* Có thể thêm số chapter hoặc lượt xem ở đây nếu API trả về */}
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Chỉnh sửa</button>
                <button className="text-sm text-red-600 hover:text-red-800 font-medium">Xóa</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReaderView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Tủ Truyện Cá Nhân</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BookOpen className="text-blue-500" />
            Đang Đọc
          </h3>
          <p className="text-gray-500">Chức năng đang phát triển...</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BookOpen className="text-pink-500" />
            Yêu Thích
          </h3>
          <p className="text-gray-500">Chức năng đang phát triển...</p>
        </div>
      </div>
    </div>
  );

  const renderAdminView = () => (
    <div className="text-center py-10">
      <Settings className="mx-auto h-16 w-16 text-gray-400 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800">Trang Quản Trị Viên</h2>
      <p className="text-gray-600 mb-6">Vui lòng truy cập Dashboard dành riêng cho Admin.</p>
      <Link 
        href="/admin" 
        className="inline-block bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
      >
        Đến Dashboard Admin
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center gap-4 mb-8 border-b pb-6">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {infoUser.fullName?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{infoUser.fullName}</h1>
              <p className="text-gray-500">{infoUser.email} • <span className="font-medium text-blue-600">{infoUser.role}</span></p>
            </div>
          </div>

          {infoUser.role === "Uploader" && renderUploaderView()}
          {infoUser.role === "Reader" && renderReaderView()}
          {infoUser.role === "Admin" && renderAdminView()}
        </div>
      </div>
    </div>
  );
}
