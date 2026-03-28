/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import MangaCard from "@/app/components/client/MangaCard";
import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/app/utils/api";

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
  const [allMangas, setAllMangas] = useState<Manga[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 5;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageFromQuery = Number(searchParams.get("page") || "1");
  const currentPage =
    Number.isFinite(pageFromQuery) && pageFromQuery > 0
      ? Math.floor(pageFromQuery)
      : 1;

  const mangasToShow = (allMangas || []).filter(
    (manga) => manga.status !== "Pending",
  );

  const goToPage = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(totalPages || 1, nextPage));
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("page", String(safePage));
    setIsLoading(true);
    router.push(`${pathname}?${nextParams.toString()}`);
  };

  useEffect(() => {
    apiFetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/mangas?page=${currentPage}&limit=${itemsPerPage}`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const mapped = (data.data?.items || []).map((item: any) => ({
            manga_id: String(item.mangaId),
            title: item.title,
            author_name: item.authorName,
            original_language: "",
            genres: item.genres || [],
            status: item.status,
            cover_image: item.coverImage,
            average_rating: item.averageRating,
            total_chapters: item.totalChapters,
          }));
          setAllMangas(mapped);
          setTotalPages(data.data?.pagination?.totalPages || 0);
        } else {
          setAllMangas([]);
          setTotalPages(0);
        }
      })
      .catch(() => {
        setAllMangas([]);
        setTotalPages(0);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentPage]);

  // Scroll to top when component mounts

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
                  onClick={() => router.push(`/manga/${manga.manga_id}`)}
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
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
                >
                  Trước
                </button>
                <span className="text-gray-700 dark:text-white">
                  Trang {currentPage} của {totalPages}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
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
