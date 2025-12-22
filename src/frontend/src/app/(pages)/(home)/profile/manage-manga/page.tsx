/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { BookOpen, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import MangaCard from "@/app/components/client/MangaCard";
import Image from "next/image";

export default function ManagePage() {
  const [myMangas, setMyMangas] = useState<any[]>([]);
  const { infoUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

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
  if (!infoUser || isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const renderUploaderView = () => {
    // Tính toán phân trang
    const totalPages = Math.ceil(myMangas.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMangas = myMangas.slice(indexOfFirstItem, indexOfLastItem);

    const handleNextPage = () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    };

    const handlePrevPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };

    return (
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
              Bắt đầu hành trình tác giả của bạn bằng cách đăng tải bộ truyện
              đầu tiên.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentMangas.map((manga) => (
                <MangaCard
                  key={manga.manga_id}
                  manga_id={manga.manga_id}
                  manga_name={manga.title}
                  author={manga.author_name || "Đang cập nhật"}
                  original_language={manga.original_language || ""}
                  genre={manga.genres?.join(", ") || "Chưa phân loại"}
                  status={manga.status || "Đang cập nhật"}
                  coverUrl={manga.cover_image || "/placeholder-manga.jpg"}
                  average_rating={manga.average_rating || 0}
                  totalChapters={manga.total_chapters || 0}
                />
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                  }`}
                >
                  <ChevronLeft size={18} />
                  Trước
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-bold transition-all ${
                          currentPage === page
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                  }`}
                >
                  Sau
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100 rotate-3 overflow-hidden">
              {infoUser?.avatar ? (
                <Image
                  src={infoUser.avatar || "/default-avatar.png"}
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="h-full w-full rounded-3xl object-cover rotate-[-3deg] shadow-md shadow-blue-200"
                />
              ) : (
                <span className="rotate-[-3deg]">
                  {(infoUser?.full_name?.trim()?.[0] || "?").toUpperCase()}
                </span>
              )}
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
