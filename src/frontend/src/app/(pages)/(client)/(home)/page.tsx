// src/app/(site)/(home)/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

const CONTINUE_READING = [
  {
    id: 1,
    title: "Berserk - Guide book",
    image: "/mock/continue-1.jpg",
    chapter: "368 Chương",
    rating: 8.91,
  },
  {
    id: 2,
    title: "Solo Leveling",
    image: "/mock/continue-2.jpg",
    chapter: "124 Chương",
    rating: 9.15,
  },
  {
    id: 3,
    title: "Berserk",
    image: "/mock/continue-3.jpg",
    chapter: "368 Chương",
    rating: 9.32,
  },
  {
    id: 4,
    title: "The beginning after the end",
    image: "/mock/continue-4.jpg",
    chapter: "112 Chương",
    rating: 9.05,
  },
  {
    id: 5,
    title: "Versatile Mage",
    image: "/mock/continue-5.jpg",
    chapter: "165 Chương",
    rating: 8.78,
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

      {/* ---- CONTINUE READING ---- */}
      <section className="space-y-3">
        <div className="rounded-t-xl bg-slate-900 p-4">
          <h3 className="text-base font-semibold text-white mb-3">
            Nổi bật <span className="text-amber-2 00">trong tháng</span>
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {CONTINUE_READING.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-md bg-slate-800 shadow-sm flex flex-col"
              >
                <div className="relative h-44 w-full">
                  <Image
                    src={"/image/logo.jpg"}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-3 bg-white">
                  <div>
                    <h4 className="text-sm font-semibold text-white line-clamp-2 bg-red">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-[11px] text-slate-300">
                      {item.chapter}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-200">
                    <span>Đánh giá</span>
                    <span className="font-semibold text-amber-300">
                      ★ {item.rating.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
