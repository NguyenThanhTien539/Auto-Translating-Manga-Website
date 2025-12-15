// src/app/(site)/(home)/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import MangaCard from "@/app/components/client/MangaCard";

type HighlightItem = {
  id: number;
  title: string;
  description: string;
  image: string;
  chapter: string;
  type: string;
};

const HIGHLIGHT_ITEMS: HighlightItem[] = [
  {
    id: 1,
    title: "One Piece",
    description:
      "Kid so focused on building a bird out of scrap-metal, he doesn’t realize his head just turned into a bird’s nest.",
    image: "/mock/onepiece.jpg",
    chapter: "Chương 1012",
    type: "Manga",
  },
  {
    id: 2,
    title: "Solo Leveling",
    description:
      "The weakest hunter becomes the strongest through mysterious power.",
    image: "/mock/solo-leveling.jpg",
    chapter: "Chương 124",
    type: "Manhwa",
  },
  {
    id: 3,
    title: "Berserk",
    description: "A dark fantasy tale of revenge, fate and struggle.",
    image: "/mock/berserk.jpg",
    chapter: "Chương 368",
    type: "Manga",
  },
];

const CATEGORIES = [
  "All category",
  "Shonen",
  "Shojo",
  "Seinen",
  "Josei",
  "Kodomonuke",
  "One Shot",
  "Action",
  "Adventure",
  "Fantasy",
  "Dark Fantasy",
  "Ecchi",
  "Romance",
  "Horror",
  "Parody",
  "Mistery",
];

// Dữ liệu giả cho MangaCard
const MOCK_MANGA_DATA = [
  {
    manga_id: "1",
    manga_name: "Berserk - Guide book",
    author: "Kentaro Miura",
    original_language: "Japan",
    genre: "Dark Fantasy - Drama - Fantasy - Adventure",
    status: "Continuous",
    coverUrl: "/image/logo.jpg",
    rating: 8.91,
    totalChapters: 4,
  },
  {
    manga_id: "2",
    manga_name: "Solo Leveling",
    author: "Chugong",
    original_language: "Korea",
    genre: "Action - Fantasy - Adventure",
    status: "Completed",
    coverUrl: "/image/logo.jpg",
    rating: 9.15,
    totalChapters: 124,
  },
  {
    manga_id: "3",
    manga_name: "One Piece",
    author: "Eiichiro Oda",
    original_language: "Japan",
    genre: "Adventure - Action - Comedy - Fantasy",
    status: "Ongoing",
    coverUrl: "/image/logo.jpg",
    rating: 9.32,
    totalChapters: 1012,
  },
  {
    manga_id: "4",
    manga_name: "The Beginning After The End",
    author: "TurtleMe",
    original_language: "Korea",
    genre: "Action - Fantasy - Adventure - Drama",
    status: "Ongoing",
    coverUrl: "/image/logo.jpg",
    rating: 9.05,
    totalChapters: 112,
  },
];

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto slide 3s
  useEffect(() => {
    if (HIGHLIGHT_ITEMS.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HIGHLIGHT_ITEMS.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const current = HIGHLIGHT_ITEMS[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? HIGHLIGHT_ITEMS.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % HIGHLIGHT_ITEMS.length);
  };

  return (
    <div className=" px-3 space-y-6">
      {/* ---- OUT NOW + HIGHLIGHT SLIDER ---- */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Out now 🎉</h2>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-slate-900 text-white shadow-md">
          {/* Ảnh nền */}
          <div className="relative h-60 w-full">
            <Image
              src={"/image/logo.jpg"}
              alt={current.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
          </div>

          {/* Nội dung overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-6">
            <div className="flex items-center justify-between text-xs text-slate-100">
              <span className="bg-black/40 px-3 py-1 rounded-full">
                New chapter
              </span>
              <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full text-[11px]">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {current.type}
              </span>
            </div>

            <div>
              <h3 className="text-3xl font-bold drop-shadow-sm">
                {current.title}
              </h3>
              <p className="mt-2 max-w-xl text-sm text-slate-100">
                {current.description}
              </p>

              <button className="mt-4 inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-700">
                Đọc
              </button>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs">
                <span className="uppercase tracking-wide">Chương</span>
                <span className="font-semibold">{current.chapter}</span>
              </div>
            </div>

            {/* Nút điều hướng + dots */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  className="h-7 w-7 rounded-full bg-black/40 text-xs hover:bg-black/60"
                >
                  ‹
                </button>
                <button
                  onClick={handleNext}
                  className="h-7 w-7 rounded-full bg-black/40 text-xs hover:bg-black/60"
                >
                  ›
                </button>
              </div>

              <div className="flex gap-2">
                {HIGHLIGHT_ITEMS.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveIndex(index)}
                    className={`h-2 w-2 rounded-full ${
                      index === activeIndex
                        ? "bg-white"
                        : "bg-white/40 hover:bg-white/80"
                    }`}
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
          {CATEGORIES.map((cat, idx) => (
            <button
              key={cat}
              className={`rounded-full border px-3 py-1 text-xs font-medium shadow-sm
              ${
                idx === 0
                  ? "border-amber-600 bg-amber-100 text-slate-900"
                  : "border-amber-200 bg-amber-50 text-slate-800 hover:bg-amber-100"
              }`}
            >
              {cat}
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
            {MOCK_MANGA_DATA.map((manga) => (
              <MangaCard
                key={manga.manga_id}
                manga_id={manga.manga_id}
                manga_name={manga.manga_name}
                author={manga.author}
                original_language={manga.original_language}
                genre={manga.genre}
                status={manga.status}
                coverUrl={manga.coverUrl}
                rating={manga.rating}
                totalChapters={manga.totalChapters}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
