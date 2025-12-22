"use client";

import MangaCard from "@/app/components/client/MangaCard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
export default function Explore() {
  const [allMangas, setAllMangas] = useState<Manga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();

  const totalPages = Math.ceil(allMangas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const mangasToShow = allMangas.slice(startIndex, endIndex).filter(manga => manga.status !== "Pending" );
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/all`)
      .then((response) => response.json())
      .then((data) => {
        if (data.code === "success") {
          setAllMangas(data.mangas);
          setCurrentPage(1); // Reset to first page when new data loads
        } else {
          setAllMangas([]);
        }
      })
      .catch(() => {
        setAllMangas([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-500 min-h-screen">
          {/* Popular this month */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Tất cả <span className="text-amber-500">truyện</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {mangasToShow.map((manga) => (
                <div
                  key={manga.manga_id}
                  onClick={() =>
                    router.push(`/explore/manga/${manga.manga_id}`)
                  }
                  className="cursor-pointer"
                >
                  <MangaCard
                    manga_id={manga.manga_id}
                    manga_name={manga.title}
                    author={manga.author_name}
                    original_language={manga?.original_language}
                    genre={manga?.genres?.join(" - ")}
                    status={manga?.status}
                    coverUrl={manga.cover_image}
                    average_rating={manga?.average_rating}
                    totalChapters={manga?.total_chapters}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
                >
                  Trước
                </button>
                <span className="text-gray-700 dark:text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
                >
                  Sau
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
