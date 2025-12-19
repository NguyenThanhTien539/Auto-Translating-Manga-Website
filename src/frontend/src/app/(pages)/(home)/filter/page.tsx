"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MangaCard from "@/app/components/client/MangaCard";

type Manga = {
  manga_id: string;
  title: string;
  author_name?: string;
  original_language?: string;
  genres?: string[]; 
  genre_names?: string[]; 
  status?: string;
  cover_image?: string;
  average_rating?: number;
  total_chapters?: number; 
};

export default function FilterPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [mangas, setMangas] = useState<Manga[]>([]);

  // ---- build URL query để gọi backend ----
  const requestUrl = useMemo(() => {
    const q = new URLSearchParams();

    // keyword (nếu bạn muốn kết hợp search)
    const keyword = sp.get("keyword");
    if (keyword) q.set("keyword", keyword);

    const chaptersMin = sp.get("chaptersMin");
    const chaptersMax = sp.get("chaptersMax");

    // state: bạn đang có lúc dùng "complete" / lúc "completed"
    const stateRaw = sp.get("state");
    const state =
      stateRaw === "complete" ? "completed" : stateRaw; // normalize nhẹ

    const type = sp.get("type");

    if (chaptersMin) q.set("chaptersMin", chaptersMin);
    if (chaptersMax) q.set("chaptersMax", chaptersMax);
    if (state && state !== "all") q.set("state", state);
    if (type && type !== "all") q.set("type", type);

    // categories có thể là:
    // - categories=1&categories=2 (append nhiều lần)
    // - categories=1,2,3 (một chuỗi)
    const categoriesMulti = sp.getAll("categories");
    const categoriesOne = sp.get("categories");

    const ids =
      categoriesMulti.length > 0
        ? categoriesMulti
        : categoriesOne
          ? categoriesOne.split(",").map((x) => x.trim()).filter(Boolean)
          : [];

    ids.forEach((id) => q.append("categories", id));

    return `${API_URL}/manga/filter?${q.toString()}`;
  }, [sp, API_URL]);

  useEffect(() => {
    if (!API_URL) return;

    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetch(requestUrl, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.code === "success") {
          // bạn có thể trả về data.mangas hoặc data.data tùy backend
          const rows: Manga[] = data?.data ?? data?.mangas ?? [];
          setMangas(rows);
        } else {
          setMangas([]);
          setError(data?.message || "Không thể tải kết quả lọc");
        }
      })
      .catch((e) => {
        if (e?.name !== "AbortError") {
          setMangas([]);
          setError("Lỗi kết nối server");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [requestUrl, API_URL]);

  // UI
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Title */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Kết quả tìm kiếm
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-400"
          >
            Quay lại
          </button>
        </header>

        {/* Loading / Error */}
        {loading && (
          <div className="py-10 text-center text-gray-600 dark:text-gray-300">
            Đang tải kết quả...
          </div>
        )}

        {!loading && error && (
          <div className="py-10 text-center text-rose-600">{error}</div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <>
            {mangas.length === 0 ? (
              <div className="py-10 text-center text-gray-600 dark:text-gray-300">
                Không có kết quả phù hợp.
              </div>
            ) : (
              <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                {mangas.map((m) => {
                  const genres =
                    m.genres ?? m.genre_names ?? []; // tùy backend trả
                  return (
                    <MangaCard
                      key={m.manga_id}
                      manga_id={m.manga_id}
                      manga_name={m.title}
                      author={m.author_name || "N/A"}
                      original_language={m.original_language || "Unknown"}
                      genre={Array.isArray(genres) ? genres.join(" - ") : ""}
                      status={m.status || "Unknown"}
                      coverUrl={m.cover_image || "/images/placeholder-cover.jpg"}
                      average_rating={Number.isFinite(m.average_rating as number) ? (m.average_rating as number) : 0}
                      totalChapters={m.total_chapters ?? 0}
                    />
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
