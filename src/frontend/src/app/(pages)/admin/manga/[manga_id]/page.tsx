/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { Star, Sparkles } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  normalizeMangaStatus,
  toVietnameseMangaStatus,
} from "@/utils/manga-status";
import { getSocketClient } from "@/socket/socket.client";
import { AdminSocketPayload } from "@/socket/socket.types";

interface Chapter {
  chapter_id: string;
  chapter_number: string;
  title: string;
  views?: number;
  status?: string;
  coin_price?: number;
}

type Manga = {
  manga_id: string;
  manga_name?: string;
  title: string;
  author_name: string;
  cover_image: string;
  description: string;
  genres: string[];
  status: string;
  totalChapters?: number;
  average_rating?: number;
  is_highlighted?: boolean;
};

const getChapterStatusBadge = (status?: string) => {
  const s = normalizeMangaStatus(status);

  const map: Record<string, { label: string; cls: string }> = {
    draft: {
      label: "Bản nháp",
      cls: "bg-gray-50 text-gray-700 border-gray-200",
    },
    processing: {
      label: "Đang xử lý",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
    pending_review: {
      label: "Chờ duyệt",
      cls: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    published: {
      label: "Đã xuất bản",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    rejected: {
      label: "Bị từ chối",
      cls: "bg-red-50 text-red-700 border-red-200",
    },
    processing_failed: {
      label: "Xử lý thất bại",
      cls: "bg-rose-50 text-rose-700 border-rose-200",
    },
  };

  const picked = map[s] || {
    label: toVietnameseMangaStatus(status),
    cls: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${picked.cls}`}
    >
      {picked.label}
    </span>
  );
};

const getMangaStatusBadge = (status?: string) => {
  const s = normalizeMangaStatus(status);
  const map: Record<string, { label: string; cls: string }> = {
    draft: {
      label: "Bản nháp",
      cls: "bg-gray-50 text-gray-700 border-gray-200",
    },
    processing: {
      label: "Đang xử lý",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
    pending_review: {
      label: "Chờ duyệt",
      cls: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    published: {
      label: "Đã xuất bản",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    rejected: {
      label: "Bị từ chối",
      cls: "bg-red-50 text-red-700 border-red-200",
    },
    processing_failed: {
      label: "Xử lý thất bại",
      cls: "bg-rose-50 text-rose-700 border-rose-200",
    },
  };
  const picked = map[s] || {
    label: toVietnameseMangaStatus(status),
    cls: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${picked.cls}`}
    >
      {picked.label}
    </span>
  );
};

const mapChapterStatusToOption = (
  status?: string,
): "pending_review" | "published" | "rejected" => {
  const s = normalizeMangaStatus(status);
  if (s === "published") return "published";
  if (s === "rejected") return "rejected";
  return "pending_review";
};

const decodeHtml = (html: string) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

export default function ReadPage() {
  const router = useRouter();
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
  const [activeTab, setActiveTab] = useState<
    "overview" | "chapters" | "edit-status"
  >("overview");
  const [statusDraft, setStatusDraft] = useState<string>("");

  const [chapterDrafts, setChapterDrafts] = useState<Record<string, string>>(
    {},
  );
  const [coinDrafts, setCoinDrafts] = useState<Record<string, number>>({});
  const [isHighlight, setIsHighlight] = useState<boolean>(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState<boolean>(false);
  const [highlightDuration, setHighlightDuration] = useState<number>(7);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get("tab");
      if (t === "overview" || t === "chapters" || t === "edit-status") {
        setActiveTab(t as "overview" | "chapters" | "edit-status");
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    if (activeTab !== "edit-status") return;
    if (!mangaDetail) return;

    setStatusDraft(normalizeMangaStatus(mangaDetail.manga.status));

    setChapterDrafts(
      (mangaDetail.chapters || []).reduce(
        (acc, c) => {
          acc[c.chapter_id] = mapChapterStatusToOption(c.status);
          return acc;
        },
        {} as Record<string, string>,
      ),
    );

    setCoinDrafts(
      (mangaDetail.chapters || []).reduce(
        (acc, c) => {
          acc[c.chapter_id] = c.coin_price ?? 0;
          return acc;
        },
        {} as Record<string, number>,
      ),
    );
  }, [activeTab, mangaDetail]);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", activeTab);
      window.history.replaceState(null, "", url.toString());
    } catch (err) {}
  }, [activeTab]);

  useEffect(() => {
    if (!mangaId) {
      setLoading(false);
      setMangaDetail(null);
      return;
    }

    setLoading(true);

    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/mangas/${mangaId}`,
      {
        credentials: "include",
      },
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.code === "success") {
          setMangaDetail(data.data);
          setIsHighlight(data.data?.manga?.is_highlighted || false);
        } else {
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
  }, [mangaId]);

  useEffect(() => {
    if (!mangaId) return;

    const socket = getSocketClient();

    const refreshDetail = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/mangas/${mangaId}`,
          { credentials: "include" },
        );
        const data = await res.json();
        if (data?.code === "success") {
          setMangaDetail(data.data);
        }
      } catch (error) {
        console.error("Refresh manga detail failed:", error);
      }
    };

    const onNewPendingChapter = (payload: AdminSocketPayload) => {
      if ("mangaId" in payload && String(payload.mangaId) === String(mangaId)) {
        toast.info("Manga này có chapter mới chờ duyệt");
        refreshDetail();
      }
    };

    const onNewPendingManga = (payload: AdminSocketPayload) => {
      if ("mangaId" in payload && String(payload.mangaId) === String(mangaId)) {
        toast.info("Manga này vừa chuyển sang trạng thái chờ duyệt");
        refreshDetail();
      }
    };

    const onChapterFailed = (payload: AdminSocketPayload) => {
      if ("mangaId" in payload && String(payload.mangaId) === String(mangaId)) {
        toast.error(
          `Một chapter xử lý thất bại: ${
            "error" in payload && payload.error ? payload.error : "Unknown error"
          }`,
        );
        refreshDetail();
      }
    };

    const onMangaFailed = (payload: AdminSocketPayload) => {
      if ("mangaId" in payload && String(payload.mangaId) === String(mangaId)) {
        toast.error(
          `Manga xử lý thất bại: ${
            "error" in payload && payload.error ? payload.error : "Unknown error"
          }`,
        );
        refreshDetail();
      }
    };

    socket.on("admin:new-pending-chapter", onNewPendingChapter);
    socket.on("admin:new-pending-manga", onNewPendingManga);
    socket.on("admin:chapter-processing-failed", onChapterFailed);
    socket.on("admin:manga-processing-failed", onMangaFailed);

    return () => {
      socket.off("admin:new-pending-chapter", onNewPendingChapter);
      socket.off("admin:new-pending-manga", onNewPendingManga);
      socket.off("admin:chapter-processing-failed", onChapterFailed);
      socket.off("admin:manga-processing-failed", onMangaFailed);
    };
  }, [mangaId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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

  return (
    <div className="w-full min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-3">
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
            <button
              onClick={() => {
                setActiveTab("edit-status");
                setStatusDraft(normalizeMangaStatus(mangaDetail.manga.status));
                setChapterDrafts(
                  (mangaDetail?.chapters || []).reduce(
                    (acc, c) => {
                      acc[c.chapter_id] = mapChapterStatusToOption(c.status);
                      return acc;
                    },
                    {} as Record<string, string>,
                  ),
                );
                setCoinDrafts(
                  (mangaDetail?.chapters || []).reduce(
                    (acc, c) => {
                      acc[c.chapter_id] = c.coin_price ?? 0;
                      return acc;
                    },
                    {} as Record<string, number>,
                  ),
                );
              }}
              className={`py-4 font-semibold text-sm sm:text-base transition-colors ${
                activeTab === "edit-status"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              Chỉnh sửa trạng thái
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 flex justify-center md:justify-start">
                <div className="relative w-40 h-60 sm:w-48 sm:h-72 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                  <Image
                    src={mangaDetail.manga.cover_image}
                    alt="manga cover"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {mangaDetail.manga.title}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2">
                  {mangaDetail.manga.author_name}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {getMangaStatusBadge(mangaDetail.manga.status)}

                  {/* Highlight Button with Duration */}
                  {normalizeMangaStatus(mangaDetail.manga.status) !==
                    "pending_review" && (
                    <div className="relative">
                      <button
                        onClick={async () => {
                          // Nếu đang highlight -> click là tắt highlight (gọi API)
                          if (isHighlight) {
                            const prev = isHighlight;
                            const prevDuration = highlightDuration;

                            const next = false;

                            // Optimistic UI
                            setIsHighlight(next);
                            setShowHighlightMenu(false);

                            try {
                              const res = await fetch(
                                `${process.env.NEXT_PUBLIC_API_BASE_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/mangas/${mangaDetail.manga.manga_id}/highlight`,
                                {
                                  method: "PATCH",
                                  credentials: "include",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    is_highlight: next,
                                    highlight_duration: 0,
                                  }),
                                },
                              );
                              const data = await res.json();
                              if (data.code === "success") {
                                toast.success(
                                  data.message ||
                                    "Bỏ truyện nổi bật thành công",
                                );
                              } else {
                                setIsHighlight(prev);
                                setHighlightDuration(prevDuration);
                                toast.error(
                                  data?.message || "Bỏ truyện nổi bật thất bại",
                                );
                              }
                            } catch (err) {
                              // rollback
                              setIsHighlight(prev);
                              setHighlightDuration(prevDuration);
                              toast.error("Lỗi kết nối server");
                            }

                            return;
                          }

                          // Nếu chưa highlight -> mở menu chọn duration
                          setShowHighlightMenu((v) => !v);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 hover:scale-105 ${
                          isHighlight
                            ? "bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-700 border-amber-300 shadow-md"
                            : "bg-gray-50 text-gray-500 border-gray-300 hover:border-amber-300 hover:bg-amber-50/50"
                        }`}
                        title={
                          isHighlight
                            ? "Click để bỏ truyện khỏi nổi bật"
                            : "Click để đặt truyện làm nổi bật"
                        }
                      >
                        <Sparkles
                          size={14}
                          className={`transition-all duration-200 ${
                            isHighlight
                              ? "fill-amber-500 text-amber-500"
                              : "text-gray-400"
                          }`}
                        />
                        Highlight
                      </button>

                      {/* Duration Dropdown Menu */}
                      {showHighlightMenu && !isHighlight && (
                        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 min-w-[200px]">
                          <p className="text-xs font-semibold text-gray-700 mb-2">
                            Chọn thời gian nổi bật:
                          </p>

                          <div className="space-y-1.5">
                            {[3, 7, 14, 30].map((days) => (
                              <button
                                key={days}
                                onClick={async () => {
                                  const prev = isHighlight;
                                  const prevDuration = highlightDuration;

                                  const next = true;

                                  // Optimistic UI
                                  setHighlightDuration(days);
                                  setIsHighlight(next);
                                  setShowHighlightMenu(false);

                                  try {
                                    const res = await fetch(
                                      `${process.env.NEXT_PUBLIC_API_BASE_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/mangas/${mangaDetail.manga.manga_id}/highlight`,
                                      {
                                        method: "PATCH",
                                        credentials: "include",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          is_highlight: next,
                                          highlight_duration: days,
                                        }),
                                      },
                                    );

                                    const data = await res.json();
                                    if (data.code === "success") {
                                      toast.success(
                                        data.message ||
                                          "Đặt truyện nổi bật thành công",
                                      );
                                    } else {
                                      {
                                        setIsHighlight(prev);
                                        setHighlightDuration(prevDuration);
                                        toast.error(
                                          data?.message ||
                                            "Đặt truyện nổi bật thất bại",
                                        );
                                      }
                                    }
                                  } catch (err) {
                                    // rollback
                                    setIsHighlight(prev);
                                    setHighlightDuration(prevDuration);
                                    toast.error("Lỗi kết nối server");
                                  }
                                }}
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-amber-50 text-gray-700 hover:text-amber-700 transition-colors flex items-center justify-between group"
                              >
                                <span>{days} ngày</span>
                                <span className="text-xs text-gray-400 group-hover:text-amber-500">
                                  {days === 3
                                    ? "Ngắn hạn"
                                    : days === 7
                                      ? "1 tuần"
                                      : days === 14
                                        ? "2 tuần"
                                        : "1 tháng"}
                                </span>
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => setShowHighlightMenu(false)}
                            className="w-full mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 hover:text-gray-700 text-center"
                          >
                            Hủy
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Chương
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {mangaDetail.manga.totalChapters}+
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Đánh giá
                    </p>
                    <div className="flex items-center gap-2">
                      <Star
                        size={18}
                        className="text-yellow-500 fill-yellow-500"
                      />
                      <span className="text-2xl font-bold text-yellow-600">
                        {mangaDetail.manga.average_rating
                          ? mangaDetail.manga.average_rating.toFixed(1)
                          : "0"}
                      </span>
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
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                  Nội dung
                </h2>
                <p
                  className={`text-gray-700 leading-relaxed ${
                    !showFullDescription ? "line-clamp-4" : ""
                  }`}
                >
                  {decodeHtml(
                    mangaDetail?.manga.description.replace(/<[^>]+>/g, ""),
                  )}
                </p>
                <button
                  onClick={() => setShowFullDescription((v) => !v)}
                  className="mt-3 text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  {showFullDescription ? "Thu gọn" : "Xem thêm"}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                  Danh mục
                </h2>
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
                    onClick={() =>
                      router.push(
                        `/${process.env.NEXT_PUBLIC_PATH_ADMIN}/manga/${mangaDetail.manga.manga_id}/chapters/${chapter.chapter_id}`,
                      )
                    }
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Title + status badge */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          Chương {chapter.chapter_number}: {chapter.title}
                        </div>
                        {getChapterStatusBadge(chapter.status)}
                      </div>
                    </div>
                  </div>
                ))}

                {mangaDetail.chapters.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Chưa có chương nào.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "edit-status" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                Chỉnh sửa trạng thái truyện
              </h2>

              <div className="max-w-md">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value)}
                      className="w-full border rounded-lg p-2.5 bg-white text-sm"
                    >
                      <option value="draft">Bản nháp</option>
                      <option value="processing">Đang xử lý</option>
                      <option value="pending_review">Chờ duyệt</option>
                      <option value="published">Đã xuất bản</option>
                      <option value="rejected">Bị từ chối</option>
                      <option value="processing_failed">Xử lý thất bại</option>
                    </select>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `${process.env.NEXT_PUBLIC_API_BASE_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/mangas/${mangaDetail.manga.manga_id}/status`,
                          {
                            method: "PATCH",
                            credentials: "include",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ status: statusDraft }),
                          },
                        );
                        const data = await res.json();
                        if (data.code === "success") {
                          toast.success(
                            "Cập nhật trạng thái truyện thành công",
                          );

                          setMangaDetail((prev) => {
                            if (!prev) return prev;

                            const normalizedDraft =
                              normalizeMangaStatus(statusDraft);
                            const nextChapterStatus =
                              normalizedDraft === "published"
                                ? "published"
                                : normalizedDraft === "rejected"
                                  ? "rejected"
                                  : null;

                            return {
                              ...prev,
                              manga: {
                                ...prev.manga,
                                status: normalizeMangaStatus(statusDraft),
                              },
                              chapters: nextChapterStatus
                                ? prev.chapters.map((c) => ({
                                    ...c,
                                    status: nextChapterStatus,
                                  }))
                                : prev.chapters,
                            };
                          });

                          const normalizedDraft =
                            normalizeMangaStatus(statusDraft);
                          if (
                            normalizedDraft === "published" ||
                            normalizedDraft === "rejected"
                          ) {
                            const next =
                              normalizedDraft === "published"
                                ? "published"
                                : "rejected";
                            setChapterDrafts((prev) => {
                              const copy = { ...prev };
                              (mangaDetail?.chapters || []).forEach(
                                (c) => (copy[c.chapter_id] = next),
                              );
                              return copy;
                            });
                          }
                        } else {
                          toast.error(data?.message || "Cập nhật thất bại");
                        }
                      } catch (err) {
                        toast.error("Lỗi kết nối server");
                      }
                    }}
                    className="h-[42px] px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Lưu
                  </button>
                </div>
              </div>

              {/* Chapters moderation */}
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3">
                  Danh sách chương
                </h3>
                <div className="space-y-3">
                  {(mangaDetail.chapters || []).map((ch) => {
                    const originalOption = mapChapterStatusToOption(ch.status);
                    const draft =
                      chapterDrafts[ch.chapter_id] ?? originalOption;
                    const changed = draft !== originalOption;

                    const originalCoin = ch.coin_price ?? 0;
                    const coinDraft = coinDrafts[ch.chapter_id] ?? originalCoin;
                    const coinChanged = coinDraft !== originalCoin;

                    const isApproved = draft === "published";

                    return (
                      <div
                        key={ch.chapter_id}
                        className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg bg-white hover:border-blue-300 transition-colors"
                      >
                        {/* Header: Tiêu đề và badge */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              Chương {ch.chapter_number}: {ch.title}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                              {getChapterStatusBadge(ch.status)}
                              <div className="text-xs text-gray-500">
                                ID: {ch.chapter_id}
                              </div>
                              {ch.coin_price !== undefined &&
                                ch.coin_price > 0 && (
                                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    💰 {ch.coin_price} coin
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>

                        {/* Controls: Status select + Coin input */}
                        <div className="flex items-end gap-3 flex-wrap">
                          {/* Status Dropdown */}
                          <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Trạng thái
                            </label>
                            <select
                              value={draft}
                              onChange={(e) =>
                                setChapterDrafts((prev) => ({
                                  ...prev,
                                  [ch.chapter_id]: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="pending_review">Chờ duyệt</option>
                              <option value="published">Đã xuất bản</option>
                              <option value="rejected">Bị từ chối</option>
                            </select>
                          </div>

                          {/* Coin Input - Only show when approved */}
                          {isApproved && (
                            <div className="flex-1 min-w-[140px]">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Giá coin
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={coinDraft === 0 ? "" : coinDraft} // 0 thì để trống
                                onChange={(e) => {
                                  const v = e.target.value; // string
                                  setCoinDrafts((prev) => ({
                                    ...prev,
                                    [ch.chapter_id]:
                                      v === "" ? 0 : Math.max(0, Number(v)),
                                  }));
                                }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0"
                              />
                            </div>
                          )}

                          {/* Save Button */}
                          <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              changed || (isApproved && coinChanged)
                                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                            onClick={async () => {
                              if (!changed && !(isApproved && coinChanged))
                                return;
                              try {
                                const body = {
                                  status: draft,
                                  coin_price: isApproved ? coinDraft : 0,
                                };

                                const res = await fetch(
                                  `${process.env.NEXT_PUBLIC_API_BASE_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/mangas/chapters/${ch.chapter_id}/status`,
                                  {
                                    method: "PATCH",
                                    credentials: "include",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify(body),
                                  },
                                );
                                const data = await res.json();
                                if (data?.code === "success") {
                                  toast.success("Cập nhật chương thành công");
                                  setMangaDetail((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          chapters: prev.chapters.map((cc) =>
                                            cc.chapter_id === ch.chapter_id
                                              ? {
                                                  ...cc,
                                                  status: draft,
                                                  coin_price: isApproved
                                                    ? coinDraft
                                                    : cc.coin_price,
                                                }
                                              : cc,
                                          ),
                                        }
                                      : prev,
                                  );
                                } else {
                                  toast.error(
                                    data?.message || "Cập nhật thất bại",
                                  );
                                }
                              } catch (err) {
                                toast.error("Lỗi kết nối server");
                              }
                            }}
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
