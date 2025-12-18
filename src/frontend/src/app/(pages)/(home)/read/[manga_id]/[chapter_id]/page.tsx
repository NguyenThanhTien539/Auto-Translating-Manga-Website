/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

interface PageData {
  page_id: number;
  chapter_id: number;
  page_number: number;
  image_url: string;
  language: string;
}

export default function ChapterReadPage() {
  const params = useParams();
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<"vi" | "en">("vi");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/chapter/${params.chapter_id}/pages`)
      .then((response) => response.json())
      .then((data) => {
        if (data.code === "success") {
          console.log(data.data);
          setPages(data.data);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error fetching chapter pages:", error);
        setLoading(false);
      });
  }, [params.chapter_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Language Selection Button */}
      <div className="container mx-auto px-4 pt-4">
        <div className="max-w-4xl mx-auto flex justify-end">
          <div className="bg-gray-800 rounded-lg p-1 flex gap-1">
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
      </div>

      {/* Main Content - Scroll View */}
      <div className="container mx-auto px-4 pt-6 pb-6">
        <div className="max-w-4xl mx-auto space-y-2">
          {pages.map((page) => (
            <div
              key={page.page_id}
              className="relative bg-black rounded-lg overflow-hidden shadow-lg"
            >
              {/* Page Number Badge */}
              <div className="absolute top-4 left-4 bg-gray-800/90 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
                Trang {page.page_number}
              </div>

              {/* Page Image */}
              <Image
                src={page.image_url}
                alt={`Trang ${page.page_number}`}
                width={1200}
                height={1800}
                className="w-full h-auto"
                quality={100}
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* End of Chapter Message */}
        <div className="max-w-4xl mx-auto mt-8 mb-6">
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
  );
}
