"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Eye, MessageCircle, Download, Star } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

interface Chapter {
  chapter_id: string;
  chapter_number: string;
  title: string;
  views?: number;
  status?: string;
}

type Manga = {
  manga_id: string;
  manga_name?: string;
  title?: string;
  author: string;
  cover_image: string;
  description: string;
  genres: string[];
  status: string;
  totalChapters?: number;
  rating?: number;
};

export default function ReadPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ manga_id?: string }>();

  const mangaId = useMemo(() => {
    const raw = params?.manga_id;
    return typeof raw === "string" ? raw : undefined;
  }, [params]);

  const [mangaDetail, setMangaDetail] = useState<{
    manga: Manga;
    chapters: Chapter[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "chapters">("overview");

  const isAdminRoute = pathname?.startsWith("/admin");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const ADMIN_PATH = process.env.NEXT_PUBLIC_PATH_ADMIN || "";

  useEffect(() => {
    if (!mangaId) {
      setLoading(false);
      setMangaDetail(null);
      return;
    }

    const controller = new AbortController();

    // Bạn đang dùng endpoint client
    const detailUrl = `${API_URL}/manga/detail/${mangaId}`;

    setLoading(true);

    fetch(detailUrl, { credentials: "include", signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data?.code === "success") setMangaDetail(data.data);
        else {
          setMangaDetail(null);
          toast.error(data?.message || "Không thể tải chi tiết truyện");
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setMangaDetail(null);
          toast.error("Lỗi kết nối server");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [mangaId, isAdminRoute, API_URL, ADMIN_PATH]);

  const getChapterStatusBadge = (status?: string) => {
    const s = (status || "Pending").toLowerCase();

    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: "Chờ duyệt", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      approved: { label: "Đã duyệt", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      rejected: { label: "Từ chối", cls: "bg-red-50 text-red-700 border-red-200" },
      active: { label: "Hiển thị", cls: "bg-blue-50 text-blue-700 border-blue-200" },
      inactive: { label: "Ẩn", cls: "bg-gray-50 text-gray-700 border-gray-200" },
    };

    const picked = map[s] || { label: status || "Không rõ", cls: "bg-gray-50 text-gray-700 border-gray-200" };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${picked.cls}`}>
        {picked.label}
      </span>
    );
  };

  const getMangaStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase();
    const map: Record<string, { label: string; cls: string }> = {
      ongoing: { label: "Đang tiến hành", cls: "bg-blue-50 text-blue-700 border-blue-200" },
      completed: { label: "Hoàn thành", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      dropped: { label: "Tạm ngưng", cls: "bg-red-50 text-red-700 border-red-200" },
      pending: { label: "Chờ duyệt", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    };
    const picked = map[s] || { label: status || "Không rõ", cls: "bg-gray-50 text-gray-700 border-gray-200" };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${picked.cls}`}>
        {picked.label}
      </span>
    );
  };

  const goToChapter = (chapterId: string) => {
    if (isAdminRoute) {
      router.push(`/admin/read/${mangaId}/${chapterId}`);
      return;
    }
    router.push(`/read/${mangaId}/${chapterId}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!mangaId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-600">Missing manga id in route params.</div>
      </div>
    );
  }

  if (!mangaDetail) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-600">Không tìm thấy truyện.</div>
      </div>
    );
  }

  const mangaTitle = mangaDetail.manga.manga_name || mangaDetail.manga.title || "Untitled";
  const safeDesc = (mangaDetail.manga.description || "").replace(/<[^>]+>/g, "");
  const totalChapters = mangaDetail.manga.totalChapters ?? mangaDetail.chapters.length;
  const rating = mangaDetail.manga.rating ?? 5;

  return (
    <div className="w-full min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 font-semibold text-sm sm:text-base transition-colors ${
                activeTab === "overview"
                  ? "bg-white text-blue-700"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setActiveTab("chapters")}
              className={`py-4 font-semibold text-sm sm:text-base transition-colors ${
                activeTab === "chapters"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              Chương
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 flex justify-center md:justify-start">
                <div className="relative w-40 h-60 sm:w-48 sm:h-72 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                  <Image src={mangaDetail.manga.cover_image} alt="manga cover" fill className="object-cover" />
                </div>
              </div>

              <div className="md:col-span-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{mangaTitle}</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">{mangaDetail.manga.author}</p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {getMangaStatusBadge(mangaDetail.manga.status)}
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Chương</p>
                    <p className="text-2xl font-bold text-blue-700">{totalChapters}+</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Đánh giá</p>
                    <div className="flex items-center gap-2">
                      <Star size={18} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-yellow-600">{rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Nội dung</h2>
                <p className={`text-gray-700 leading-relaxed ${!showFullDescription ? "line-clamp-4" : ""}`}>
                  {safeDesc}
                </p>
                <button
                  onClick={() => setShowFullDescription((v) => !v)}
                  className="mt-3 text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  {showFullDescription ? "Thu gọn" : "Xem thêm"}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Danh mục</h2>
                <div className="flex flex-wrap gap-2">
                  {(mangaDetail.manga.genres || []).map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "chapters" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {mangaDetail.chapters.map((chapter) => (
                  <div
                    key={chapter.chapter_id}
                    className="px-5 sm:px-6 py-4 hover:bg-blue-50/50 cursor-pointer transition-colors"
                    onClick={() => goToChapter(chapter.chapter_id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Title + status badge */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          Chương {chapter.chapter_number}: {chapter.title}
                        </div>
                        {getChapterStatusBadge(chapter.status)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 text-gray-500">
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-white hover:text-blue-600 transition-colors flex items-center gap-2"
                          title="Lượt xem"
                        >
                          <Eye size={18} />
                          <span className="text-xs">{chapter.views?.toLocaleString?.() ?? "—"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                          title="Bình luận"
                        >
                          <MessageCircle size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                          title="Tải xuống"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {mangaDetail.chapters.length === 0 && (
                  <div className="p-8 text-center text-gray-500">Chưa có chương nào.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
