"use client";

import React, { use, useEffect, useState } from "react";
import { MessageCircle, Star, Heart, Share2 } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface Chapter {
  chapter_id: string;
  chapter_number: string;
  title: string;
  views?: number;
}

type Manga = {
  manga_id: string;
  title: string;
  author_name: string;
  cover_image: string;
  description: string;
  genres: string[];
  status: string;
  totalChapters?: number;
  average_rating?: number;
};

export default function ReadPage() {
  const router = useRouter();
  const params = useParams();
  const [mangaDetail, setMangaDetail] = useState<{
    manga: Manga;
    chapters: Chapter[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "chapters">(
    "overview"
  );
  const [isFavorite, setIsFavorite] = useState(false);

  const decodeHtml = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    const mangaTitle = mangaDetail?.manga.title || "Manga";
    const mangaAuthor = mangaDetail?.manga.author_name || "";
    const mangaGenres = mangaDetail?.manga.genres?.join(", ") || "";
    const mangaDescription = decodeHtml(
      mangaDetail?.manga.description
        ?.replace(/<[^>]+>/g, "")
        .substring(0, 200) || ""
    );

    // Tạo nội dung chia sẻ chi tiết
    const shareContent = `🔥 ${mangaTitle} 🔥

📚 Tác giả: ${mangaAuthor}
🎭 Thể loại: ${mangaGenres}

📖 Giới thiệu:
${mangaDescription}${mangaDescription.length >= 200 ? "..." : ""}

👉 Đọc ngay tại: ${currentUrl}

#Manga #${mangaTitle.replace(/\s+/g, "")} #DocTruyen`;

    try {
      // Copy nội dung vào clipboard
      await navigator.clipboard.writeText(shareContent);

      // Mở Facebook share dialog
      const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        currentUrl
      )}`;

      window.open(
        facebookShareUrl,
        "facebook-share-dialog",
        "width=800,height=600"
      );

      // Thông báo cho người dùng
      toast.success("Đã copy nội dung! Nhấn Ctrl+V  để dán vào Facebook", {
        duration: 5000,
      });
    } catch (error) {
      console.error("Copy failed:", error);

      // Fallback: mở Facebook share mà không copy
      const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        currentUrl
      )}`;
      window.open(
        facebookShareUrl,
        "facebook-share-dialog",
        "width=800,height=600"
      );

      toast.info("Đang mở Facebook share...");
    }
  };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/detail/${params.manga_id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.code === "success") {
          setMangaDetail(data.data);
        } else {
          setMangaDetail(null);
        }
      });
  }, [params.manga_id]);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/manga/check-favorite/${params.manga_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.code === "success") {
          setIsFavorite(data.data);
        } else {
          setIsFavorite(false);
        }
      });
  }, [params.manga_id]);

  return (
    mangaDetail && (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Tabs Navigation */}
        <div className="sticky top-0 z-40 border-b border-slate-700">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-0">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 md:px-8 py-4 font-semibold transition-all text-center text-sm md:text-base border-r border-slate-700 ${
                  activeTab === "overview"
                    ? "bg-white text-slate-900"
                    : "bg-slate-800/95 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab("chapters")}
                className={`px-6 md:px-8 py-4 font-semibold transition-all text-center text-sm md:text-base ${
                  activeTab === "chapters"
                    ? "bg-blue-500 text-white"
                    : "bg-slate-800/95 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Chương
              </button>
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="relative overflow-hidden pt-8 pb-12">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>

          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Cover Image */}
              <div className="md:col-span-1 flex justify-center md:justify-start">
                <div className="relative w-48 h-72 rounded-xl overflow-hidden shadow-2xl border border-blue-500/20 hover:shadow-blue-500/20 transition-shadow">
                  <Image
                    src={mangaDetail?.manga.cover_image}
                    alt={"manga cover"}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
              </div>

              {/* Manga Info */}
              <div className="md:col-span-3 text-white">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    {mangaDetail?.manga.title}
                  </h1>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleShare}
                      className="group p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600 hover:border-blue-500/50 transition-all duration-300 hover:scale-110"
                      title="Chia sẻ lên Facebook"
                    >
                      <Share2
                        size={28}
                        className="text-slate-400 group-hover:text-blue-400 transition-all duration-300"
                      />
                    </button>
                    <button
                      onClick={() => {
                        setIsFavorite(!isFavorite);
                        fetch(
                          `${process.env.NEXT_PUBLIC_API_URL}/manga/favorite`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            credentials: "include",
                            body: JSON.stringify({
                              manga_id: mangaDetail?.manga.manga_id,
                              type: isFavorite ? "remove" : "add",
                            }),
                          }
                        )
                          .then((response) => response.json())
                          .then((data) => {
                            if (data.code === "success") {
                              toast.success(data.message);
                            } else {
                              toast.error("Đã có lỗi xảy ra");
                            }
                          });
                      }}
                      className="group p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600 hover:border-pink-500/50 transition-all duration-300 hover:scale-110"
                      title={
                        isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"
                      }
                    >
                      <Heart
                        size={28}
                        className={`transition-all duration-300 ${
                          isFavorite
                            ? "fill-pink-500 text-pink-500"
                            : "text-slate-400 group-hover:text-pink-400"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <p className="text-lg text-slate-300 mb-6">
                  {mangaDetail?.manga.author_name}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-700/50 backdrop-blur rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                      Chương
                    </p>
                    <p className="text-2xl font-bold text-blue-400">
                      {mangaDetail?.manga.totalChapters}+
                    </p>
                  </div>

                  <div className="bg-slate-700/50 backdrop-blur rounded-lg p-4 border border-slate-600">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                      Đánh giá
                    </p>
                    <div className="flex items-center gap-2">
                      <Star
                        size={20}
                        className="fill-yellow-400 text-yellow-400"
                      />
                      <span className="text-2xl font-bold text-yellow-400">
                        {mangaDetail?.manga.average_rating
                          ? Number(mangaDetail.manga.average_rating).toFixed(1)
                          : "0.0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Rank */}
                <div className="flex items-center gap-4">
                  <span className="bg-blue-500/30 hover:bg-blue-500/40 text-blue-300 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-500/50 transition-colors">
                    {mangaDetail?.manga.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-12">
          {/* Tab: Tổng quan */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Description */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:bg-slate-800/70 transition-colors">
                <h2 className="text-2xl font-bold text-white mb-4">Nội dung</h2>
                <p className="text-slate-300 leading-relaxed">
                  {decodeHtml(
                    mangaDetail?.manga.description.replace(/<[^>]+>/g, "")
                  )}
                </p>
              </div>

              {/* Genres */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Danh mục</h2>
                <div className="flex flex-wrap gap-3">
                  {mangaDetail?.manga.genres.map((genre) => (
                    <button
                      key={genre}
                      className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reading Status */}
            </div>
          )}

          {/* Tab: Chương */}
          {activeTab === "chapters" && (
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                {mangaDetail?.chapters.map((chapter) => (
                  <div
                    key={chapter.chapter_id}
                    className="border-b border-slate-700 hover:bg-blue-500/10 transition-colors"
                    onClick={() => {
                      router.push(
                        `/read/${mangaDetail?.manga.manga_id}/${chapter.chapter_id}`
                      );
                    }}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">
                          Chương {chapter.chapter_number}: {chapter.title}
                        </span>
                        <div className="flex items-center gap-6 text-slate-400">
                          <button
                            type="button"
                            className="hover:text-blue-400 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();

                              const qs = new URLSearchParams({
                                manga_id: String(
                                  mangaDetail?.manga.manga_id ?? ""
                                ),
                                chapter_id: String(chapter.chapter_id),
                              });

                              router.push(`/comment?${qs.toString()}`);
                            }}
                          >
                            <MessageCircle size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
}
