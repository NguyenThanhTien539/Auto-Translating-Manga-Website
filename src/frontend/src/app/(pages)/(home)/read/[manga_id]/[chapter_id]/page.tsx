/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/app/hooks/useAuth";

interface PageData {
  page_id: number;
  chapter_id: number;
  page_number: number;
  image_url: string | null;
  language: string;
  translation_status: "original" | "translated" | "not_translated" | "processing";
}

interface TranslatingPage {
  [pageId: number]: boolean;
}

export default function ChapterReadPage() {
  const params = useParams();
  const { isLogin, infoUser } = useAuth();
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<"vi" | "en">("vi");
  const [currentPage, setCurrentPage] = useState(1);
  const [readingProgress, setReadingProgress] = useState(0);
  const [translatingPages, setTranslatingPages] = useState<TranslatingPage>({});
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPage = useRef(1);

  // Fetch pages data
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/manga/chapter/${params.chapter_id}/pages?language=${selectedLanguage}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.code === "success") {
          console.log("Pages data:", data.data);
          console.log("First page translation_status:", data.data[0]?.translation_status);
          setPages(data.data);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error fetching chapter pages:", error);
        setLoading(false);
      });
  }, [params.chapter_id, selectedLanguage]);

  // Fetch reading history and auto-scroll to last read page
  useEffect(() => {
    if (!isLogin || !infoUser || pages.length === 0) return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/reading-history/manga/${params.manga_id}`,
      {
        credentials: "include",
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.code === "success" && data.data) {
          const lastPage = data.data.last_page_read || 1;
          lastSavedPage.current = lastPage;

          // Auto scroll to last read page after a short delay
          setTimeout(() => {
            const pageElement = pageRefs.current[lastPage];
            if (pageElement) {
              pageElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }, 200);
        }
      })
      .catch((error) => {
        console.error("Error fetching reading history:", error);
      });
  }, [isLogin, infoUser, pages.length, params.manga_id]);

  // Save reading progress function
  const saveReadingProgress = useCallback(
    (pageNumber: number) => {
      if (!isLogin || !infoUser) return;

      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save - only save after user stops scrolling for 2 seconds
      saveTimeoutRef.current = setTimeout(() => {
        if (pageNumber === lastSavedPage.current) return;

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reading-history/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            chapterId: params.chapter_id,
            mangaId: params.manga_id,
            lastPageRead: pageNumber,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.code === "success") {
              lastSavedPage.current = pageNumber;
              console.log(`Saved progress: page ${pageNumber}`);
            }
          })
          .catch((error) => {
            console.error("Error saving reading progress:", error);
          });
      }, 2000);
    },
    [isLogin, infoUser, params.chapter_id, params.manga_id]
  );

  // Translate page function
  const translatePage = async (pageId: number) => {
    try {
      setTranslatingPages((prev) => ({ ...prev, [pageId]: true }));
      toast.loading(`Đang dịch trang...`, { id: `translate-${pageId}` });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/manga/translate-page`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pageId: pageId,
            targetLanguage: selectedLanguage,
          }),
        }
      );

      const data = await response.json();

      if (data.code === "success") {
        toast.success("Dịch trang thành công!", { id: `translate-${pageId}` });

        // Refresh pages to get the new translated image
        const pagesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/manga/chapter/${params.chapter_id}/pages?language=${selectedLanguage}`
        );
        const pagesData = await pagesResponse.json();

        if (pagesData.code === "success") {
          setPages(pagesData.data);
        }
      } else if (data.code === "processing") {
        toast.info("Trang này đang được dịch...", { id: `translate-${pageId}` });
      } else {
        toast.error(data.message || "Dịch trang thất bại", {
          id: `translate-${pageId}`,
        });
      }
    } catch (error) {
      console.error("Error translating page:", error);
      toast.error("Có lỗi xảy ra khi dịch trang", { id: `translate-${pageId}` });
    } finally {
      setTranslatingPages((prev) => ({ ...prev, [pageId]: false }));
    }
  };

  // Track scroll position to update current page
  useEffect(() => {
    const handleScroll = () => {
      let currentVisiblePage = 1;
      let maxVisibility = 0;

      // Find which page is most visible
      Object.entries(pageRefs.current).forEach(([pageNum, element]) => {
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Calculate how much of the page is visible
        const visibleHeight =
          Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
        const visibilityPercent = visibleHeight / rect.height;

        if (visibilityPercent > maxVisibility && visibilityPercent > 0.3) {
          maxVisibility = visibilityPercent;
          currentVisiblePage = parseInt(pageNum);
        }
      });

      setCurrentPage(currentVisiblePage);

      // Calculate overall progress
      const progress = (currentVisiblePage / pages.length) * 100;
      setReadingProgress(Math.min(progress, 100));

      // Save progress
      saveReadingProgress(currentVisiblePage);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [pages.length, saveReadingProgress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-900">
        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar - Sticky inside container */}
            <div className="sticky top-4 z-40 mb-6 bg-gray-800/95 backdrop-blur-sm shadow-lg rounded-lg">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">
                      Trang {currentPage} / {pages.length}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ({readingProgress.toFixed(0)}%)
                    </span>
                  </div>
                  {isLogin && (
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Đang lưu tiến độ
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-blue-600 h-full transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${readingProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Language Selection Button */}
            <div className="flex justify-end mb-6">
              <div className="bg-gray-800 rounded-lg p-1 flex gap-1 shadow-lg">
                <button
                  onClick={() => setSelectedLanguage("vi")}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    selectedLanguage === "vi"
                      ? "bg-sky-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Tiếng Việt
                </button>
                <button
                  onClick={() => setSelectedLanguage("en")}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    selectedLanguage === "en"
                      ? "bg-sky-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Pages */}
            <div className="space-y-2">
              {pages.map((page) => (
                <div
                  key={page.page_id}
                  ref={(el) => {
                    pageRefs.current[page.page_number] = el;
                  }}
                  className={`relative bg-black rounded-lg overflow-hidden shadow-lg transition-all ${
                    currentPage === page.page_number
                      ? "ring-2 ring-sky-500 ring-offset-2 ring-offset-gray-900"
                      : ""
                  }`}
                >
                  {/* Page Number Badge */}
                  <div className="absolute top-4 left-4 bg-gray-800/90 text-white px-3 py-1 rounded-full text-sm font-medium z-10 shadow-lg">
                    Trang {page.page_number}
                  </div>

                  {/* Translation Status Badge */}
                  {page.translation_status === "processing" && (
                    <div className="absolute top-4 right-4 bg-yellow-600/90 text-white px-3 py-1 rounded-full text-sm font-medium z-10 shadow-lg flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Đang dịch...
                    </div>
                  )}

                  {/* Translate Button - Show for untranslated pages */}
                  {page.translation_status === "original" && (
                    <div className="absolute top-16 left-4 z-10">
                      <button
                        onClick={() => translatePage(page.page_id)}
                        disabled={translatingPages[page.page_id]}
                        className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {translatingPages[page.page_id] ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            {selectedLanguage === "vi" ? "Đang dịch..." : "Translating..."}
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                              />
                            </svg>
                            {selectedLanguage === "vi" 
                              ? "Dịch sang Tiếng Việt" 
                              : "Translate to English"}
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Page Image */}
                  {page.image_url ? (
                    <Image
                      src={page.image_url}
                      alt={`Trang ${page.page_number}`}
                      width={1200}
                      height={1800}
                      className="w-full h-auto"
                      quality={100}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-96 flex items-center justify-center bg-gray-800 text-gray-400">
                      {page.translation_status === "processing"
                        ? "Đang xử lý..."
                        : "Không có ảnh"}
                    </div>
                  )}
                </div>
              ))}

              {/* End of Chapter Message */}
              <div className="mt-8 mb-6">
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <h3 className="text-white text-xl font-bold mb-4">
                    Hết chương {params.chapter_id}
                  </h3>

                  <div className="flex items-center justify-center gap-4">
                    <Link
                      href={`/read/${params.manga_id}`}
                      className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Danh sách chương
                    </Link>
                    <Link
                      href="/"
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Về trang chủ
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
