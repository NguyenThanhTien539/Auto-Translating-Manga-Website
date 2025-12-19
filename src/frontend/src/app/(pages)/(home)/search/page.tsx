"use client";

import React, { useEffect, useMemo, useState } from "react";
import MangaCard from "@/app/components/client/MangaCard";
import { useSearchParams } from "next/navigation";

type Manga = {
  manga_id: string;
  title: string;
  author_name?: string;
  original_language?: string;
  genres?: string[];
  status?: string;
  cover_image?: string;
  average_rating?: number;
  total_chapters?: number;
};

export default function SearchPage() {
  const sp = useSearchParams();
  const keyword = useMemo(() => sp.get("keyword") || "", [sp]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        setError("");
        setLoading(true);

        const res = await fetch(
          `${API_URL}/search?keyword=${encodeURIComponent(keyword)}`,
          { signal: controller.signal }
        );

        const json = await res.json();

        if (json.code !== "success") {
          setMangas([]);
          setError(json.message || "Error fetching search results");
          return;
        }

        setMangas(json.data || []);

        
      } catch (e: any) {
        if (e?.name !== "AbortError") setError("Error fetching search results");
      } finally {
        setLoading(false);
      }
    };

    run();

    return () => controller.abort();
  }, [API_URL, keyword]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Kết quả tìm kiếm
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Từ khoá: <span className="font-medium">{keyword || "(trống)"}</span>
            </p>
          </div>
        </header>

        {loading && (
          <div className="text-gray-700 dark:text-gray-200">Đang tải...</div>
        )}

        {!loading && error && (
          <div className="text-red-600 dark:text-red-400">{error}</div>
        )}

        {!loading && !error && mangas.length === 0 && (
          <div className="text-gray-700 dark:text-gray-200">
            Không tìm thấy truyện phù hợp.
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {mangas.map((m) => (
            <MangaCard
              key={m.manga_id}
              manga_id={m.manga_id}
              manga_name={m.title} // backend là title
              author={m.author_name || "Unknown"}
              original_language={m.original_language || ""}
              genre={(m.genres || []).join(", ")} // nếu có genres[]
              status={m.status || ""}
              coverUrl={m.cover_image ?? "/images/placeholder-cover.jpg"}
              average_rating={m.average_rating ?? 0}
              totalChapters={m.total_chapters ?? 0}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
