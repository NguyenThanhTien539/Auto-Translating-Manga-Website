"use client";
import React, { useEffect, useState } from "react";
import MangaCard from "@/app/components/client/MangaCard";
import { useRouter } from "next/navigation";
import { Heart, BookHeart } from "lucide-react";

type Manga = {
  manga_id: string;
  title: string;
  author_name: string;
  original_language: string;
  genres: string[];
  status: string;
  cover_image: string;
  average_rating: number;
  total_chapters: number;
};

export default function FavouriteList() {
  const [items, setItems] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/favorite-list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.code === "success") {
          setItems(data.data);
        } else {
          setItems([]);
        }
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl shadow-lg">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Danh sách yêu thích
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isLoading ? "Đang tải..." : `${items.length} truyện đã lưu`}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((manga) => (
              <div
                key={manga.manga_id}
                onClick={() => router.push(`/read/${manga.manga_id}`)}
                className="cursor-pointer group"
              >
                <MangaCard
                  manga_id={manga.manga_id}
                  manga_name={manga.title}
                  author={manga.author_name}
                  original_language={manga?.original_language}
                  genre={manga?.genres?.join(" - ")}
                  status={manga?.status}
                  coverUrl={manga.cover_image}
                  average_rating={manga.average_rating || 4.5}
                  totalChapters={manga?.total_chapters}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <div className="relative mb-6">
              <div className="p-6 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/20 rounded-full">
                <BookHeart className="w-20 h-20 text-pink-500 dark:text-pink-400" />
              </div>
              <div className="absolute -top-2 -right-2 animate-bounce">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              Chưa có truyện yêu thích
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              Hãy khám phá và thêm những bộ truyện yêu thích của bạn vào đây!
            </p>
            <button
              onClick={() => router.push("/explore")}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Khám phá ngay
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
