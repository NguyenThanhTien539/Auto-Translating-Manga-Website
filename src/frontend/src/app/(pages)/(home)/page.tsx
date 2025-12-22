/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(site)/(home)/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import MangaCard from "@/app/components/client/MangaCard";
import { useRouter } from "next/navigation";
import { decodeHtml } from "@/utils/utils";
type Manga = {
  manga_id: string;
  title: string;
  author_name: string;
  original_language: string;
  genres: string[];
  status: string;
  cover_image: string;
  description: string;
  type: string;
  chapter: string;
  average_rating: number;
  total_chapters: number;
  is_highlighted: boolean;
};

export default function Home() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const [mangas, setMangas] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/all`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setMangas(data.mangas);
        }
      })
      .catch((error) => {
        console.error("Error fetching languages:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // get mangas is highlighted
  const highlighted_mangas = mangas.filter((manga) => manga.is_highlighted);

  // get manga with status not pending 
  const slider_mangas = mangas.filter((manga) => manga.status !== "Pending").slice(0, 5);

  // Auto slide 3s
  useEffect(() => {
    if (mangas.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % mangas.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const current = mangas[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? mangas.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % mangas.length);
  };

  const handleCategoryClick = (genre_name: string) => {
    router.push(`/filter?categories=${genre_name}`);
  }

  const [genres, setGenres] = useState([]);
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/genres`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setGenres(data.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching languages:", error);
      })
      .finally(() => {
        setIsLoadingGenres(false);
      });
  }, []);

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className=" px-3 space-y-6 ">
          {/* ---- OUT NOW + HIGHLIGHT SLIDER ---- */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Out now 🎉
              </h2>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-slate-900 text-white shadow-md h-64 sm:h-72">
              {/* Ảnh nằm bên phải (mobile thì trải full, desktop thì nằm bên phải) */}
              <div className="absolute inset-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[340px]">
                {current?.cover_image ? (
                  <Image
                    src={current.cover_image}
                    alt={current.title ?? "Manga highlight"}
                    fill
                    className="object-cover object-center"
                    priority
                  />
                ) : null}
                {/* lớp phủ để chữ bên trái đọc được */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/10 sm:to-black/0" />
              </div>

              {/* Nội dung (chừa chỗ cho panel ảnh bên phải ở sm+) */}
              <div className="relative z-10 flex h-full flex-col p-6 sm:pr-[380px]">
                {/* top badges */}
                <div className="flex items-center justify-between text-xs text-slate-100">
                  <span className="bg-black/40 px-3 py-1 rounded-full">
                    New chapter
                  </span>

                  <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    {current?.type ?? "Manga"}
                  </span>
                </div>

                {/* content block (không được đẩy mất footer) */}
                <div className="mt-3 flex-1 min-h-0">
                  <h3 className="text-2xl sm:text-3xl font-bold drop-shadow-sm line-clamp-2">
                    {current?.title ?? "Đang tải..."}
                  </h3>

                  {/* Description: clamp + ... */}
                  <p className="mt-2 max-w-xl text-sm text-slate-100 line-clamp-3">
                    {decodeHtml(current?.description) || "Đang tải..."}
                  </p>

                  {/* Đọc + Chương luôn nằm dưới description */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        if (!current?.manga_id) return;
                        router.push(`/explore/manga/${current.manga_id}`);
                      }}
                      className="cursor-pointer inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                    >
                      Đọc
                    </button>
                    {/* 
                <div className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs">
                  <span className="uppercase tracking-wide">Chương</span>
                  <span className="font-semibold">{current?.chapter ?? "?"}</span>
                </div> */}
                  </div>
                </div>

                {/* Footer: nút điều hướng + dots luôn nằm đáy */}
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrev}
                      className="relative z-20 h-8 w-8 rounded-full bg-black/40 text-sm hover:bg-black/60"
                      aria-label="Previous"
                    >
                      ‹
                    </button>
                    <button
                      onClick={handleNext}
                      className="relative z-20 h-8 w-8 rounded-full bg-black/40 text-sm hover:bg-black/60"
                      aria-label="Next"
                    >
                      ›
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {slider_mangas.map((item, index) => (
                      <button
                        key={item.manga_id}
                        onClick={() => setActiveIndex(index)}
                        className={`h-2 w-2 rounded-full ${
                          index === activeIndex
                            ? "bg-white"
                            : "bg-white/40 hover:bg-white/80"
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ---- HOT CATEGORIES ---- */}
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-rose-600">
              Hot Categories
            </h3>
            <div className="flex flex-wrap gap-2 rounded-xl bg-amber-300/80 px-4 py-10">
              {(genres as any[]).map((genre, idx) => (
                <button
                  key={genre.genre_id}
                  onClick={() => handleCategoryClick(genre.genre_name)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium shadow-sm
              ${
                idx === 0
                  ? "border-amber-600 bg-amber-100 text-slate-900"
                  : "border-amber-200 bg-amber-50 text-slate-800 hover:bg-amber-100"
              }`}
                >
                  {genre.genre_name}
                </button>
              ))}
            </div>
          </section>

          {/* ---- MANGA SHOWCASE ---- */}
          <section className="space-y-3">
            <div className="rounded-t-xl bg-gradient-to-r from-sky-700 to-sky-900 p-4">
              <h3 className="text-base font-semibold text-white mb-3">
                Nổi bật <span className="text-amber-300">trong tháng</span>
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {highlighted_mangas.map((manga) => (
                  <MangaCard
                    key={manga.manga_id}
                    manga_id={manga.manga_id}
                    manga_name={manga.title}
                    author={manga.author_name}
                    original_language={manga.original_language}
                    genre={manga.genres.join("-")}
                    status={manga.status}
                    coverUrl={manga.cover_image}
                    average_rating={manga.average_rating}
                    totalChapters={manga.total_chapters}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
