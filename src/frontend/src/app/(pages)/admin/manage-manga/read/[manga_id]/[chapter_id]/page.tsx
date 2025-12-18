/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

interface PageData {
  page_id: number;
  chapter_id: number;
  page_number: number;
  image_url: string;
  language: string;
}

export default function AdminChapterReadPage() {
  const params = useParams<{ manga_id?: string; chapter_id?: string }>();

  const mangaId = useMemo(() => {
    const raw = params?.manga_id;
    return typeof raw === "string" ? raw : undefined;
  }, [params]);

  const chapterId = useMemo(() => {
    const raw = params?.chapter_id;
    return typeof raw === "string" ? raw : undefined;
  }, [params]);

  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const ADMIN_PATH = process.env.NEXT_PUBLIC_PATH_ADMIN || "";

  useEffect(() => {
    if (!chapterId) {
      setLoading(false);
      setPages([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const url = `${API_URL}/manga/chapter/${chapterId}/pages`;

    fetch(url, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.code === "success") {
          setPages(data.data || []);
        } else {
          setPages([]);
          toast.error(data?.message || "Không thể tải trang chương");
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          setPages([]);
          toast.error("Lỗi kết nối server");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [API_URL, ADMIN_PATH, chapterId]);

  if (!mangaId || !chapterId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          Missing manga_id hoặc chapter_id trong route params.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 pt-6 pb-6">
        <div className="max-w-4xl mx-auto space-y-2">
          {pages.map((page) => (
            <div
              key={page.page_id}
              className="relative bg-black rounded-lg overflow-hidden shadow-lg"
            >
              <div className="absolute top-4 left-4 bg-gray-800/90 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
                Trang {page.page_number}
              </div>

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

          {pages.length === 0 && (
            <div className="text-center text-gray-300 py-10">
              Chương này chưa có trang nào.
            </div>
          )}
        </div>

        {/* End of Chapter */}
        <div className="max-w-4xl mx-auto mt-8 mb-6">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h3 className="text-white text-xl font-bold mb-4">
              Hết chương {chapterId}
            </h3>
            <div className="flex items-center justify-center gap-4">
              <Link
                href={`/admin/manage-manga/read/${mangaId}`}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
              >
                Danh sách chương (Admin)
              </Link>

              <Link
                href="/admin/manage-manga"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Về trang Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
