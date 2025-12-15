"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Home, List } from "lucide-react";

interface ChapterPage {
  id: number;
  imageUrl: string;
}

// Mock data - thay thế bằng API call thực tế
const getChapterData = (manga_id: string, chapter_id: string) => {
  // Tạo mock data cho các trang của chương
  const pages: ChapterPage[] = [];
  for (let i = 1; i <= 20; i++) {
    pages.push({
      id: i,
      imageUrl: `https://picsum.photos/800/1200?random=${i}`, // Mock image
    });
  }

  return {
    manga_id,
    chapter_id,
    manga_name: "One Piece",
    chapter_number: chapter_id.replace("chapter-", "Chương "),
    pages,
    totalPages: pages.length,
  };
};

export default function ChapterReadPage({
  params,
}: {
  params: Promise<{ manga_id: string; chapter_id: string }>;
}) {
  const { manga_id, chapter_id } = React.use(params);
  const chapterData = getChapterData(manga_id, chapter_id);
  const [currentPage, setCurrentPage] = useState(1);
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls]);

  const handleNextPage = () => {
    if (currentPage < chapterData.totalPages) {
      setCurrentPage(currentPage + 1);
      setShowControls(true);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setShowControls(true);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") handleNextPage();
    if (e.key === "ArrowLeft") handlePrevPage();
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  });

  return (
    <div
      className="min-h-screen bg-black relative"
      onClick={() => setShowControls(!showControls)}
    >
      {/* Header - Fixed */}
      <div
        className={`fixed top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent z-50 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-white">
            <Link
              href={`/read/${manga_id}`}
              className="flex items-center gap-2 hover:text-sky-400 transition-colors"
            >
              <ChevronLeft size={24} />
              <span className="font-semibold">{chapterData.manga_name}</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                {chapterData.chapter_number} - Trang {currentPage} /{" "}
                {chapterData.totalPages}
              </span>
              <Link
                href={`/read/${manga_id}`}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <List size={20} />
              </Link>
              <Link
                href="/"
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <Home size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative w-full max-w-4xl">
          {/* Current Page Image */}
          <div className="relative w-full" style={{ aspectRatio: "2/3" }}>
            <Image
              src={chapterData.pages[currentPage - 1].imageUrl}
              alt={`Page ${currentPage}`}
              fill
              className="object-contain"
              priority
              quality={100}
            />
          </div>

          {/* Navigation Buttons - Overlay */}
          <div
            className={`absolute top-0 left-0 right-0 bottom-0 flex items-center justify-between px-4 transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Previous Button */}
            {currentPage > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevPage();
                }}
                className="p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110"
                aria-label="Previous page"
              >
                <ChevronLeft size={32} />
              </button>
            )}

            <div className="flex-1" />

            {/* Next Button */}
            {currentPage < chapterData.totalPages && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPage();
                }}
                className="p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all hover:scale-110"
                aria-label="Next page"
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent z-50 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Previous Chapter Button */}
            <Link
              href={`/read/${manga_id}/chapter-${
                parseInt(chapter_id.replace("chapter-", "")) - 1
              }`}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              Chương trước
            </Link>

            {/* Page Navigation Slider */}
            <div className="flex-1 max-w-md">
              <input
                type="range"
                min="1"
                max={chapterData.totalPages}
                value={currentPage}
                onChange={(e) => {
                  setCurrentPage(parseInt(e.target.value));
                  setShowControls(true);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-white text-xs mt-1">
                <span>1</span>
                <span>{chapterData.totalPages}</span>
              </div>
            </div>

            {/* Next Chapter Button */}
            <Link
              href={`/read/${manga_id}/chapter-${
                parseInt(chapter_id.replace("chapter-", "")) + 1
              }`}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              Chương sau
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Click Areas for Navigation (Left/Right halves) */}
      <div className="fixed inset-0 flex pointer-events-none z-40">
        <div
          className="w-1/3 cursor-pointer pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevPage();
          }}
        />
        <div className="w-1/3" />
        <div
          className="w-1/3 cursor-pointer pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            handleNextPage();
          }}
        />
      </div>
    </div>
  );
}
