"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Book, ChevronLeft } from "lucide-react"; // Cài đặt: npm install lucide-react
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
type Author = {
  author_id: string;
  author_name: string;
  avatar_url?: string;
  biography?: string;
};

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
export default function AuthorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [author, setAuthor] = React.useState<Author | null>(null);
  const [mangas, setMangas] = React.useState<Manga[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/authors/${params.author_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setAuthor(data.author);
          setMangas(data.mangas);
        } else {
          setAuthor(null);
        }
      })
      .catch(() => setAuthor(null))
      .finally(() => setLoading(false));
  }, [params.author_id]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    author && (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
        {/* Header / Navigation */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">
            {/* <Link
              href="/authors"
              className="flex items-center text-sm font-medium text-sky-700 dark:text-sky-400 hover:underline"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại danh sách
            </Link> */}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cột trái: Ảnh và thông tin nhanh */}
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="relative aspect-[3/4] w-full">
                  {author.avatar_url ? (
                    <Image
                      src={author.avatar_url}
                      alt={author.author_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                      Chưa cập nhật
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    {author.author_name}
                  </h1>
                </div>
              </div>
            </div>

            {/* Cột phải: Tiểu sử và Tác phẩm */}
            <div className="md:col-span-2 space-y-8">
              {/* Section: Biography */}
              <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="w-1 h-6 bg-sky-600 rounded-full mr-3"></span>
                  Tiểu sử
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {author.biography || "Chưa cập nhật tiểu sử."}
                </p>
              </section>

              {/* Section: Famous Works */}

              <section>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="w-1 h-6 bg-sky-600 rounded-full mr-3"></span>
                  Tác phẩm tiêu biểu
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {mangas.map((work) => (
                    <div
                      key={work.manga_id}
                      className="group cursor-pointer"
                      onClick={() => {
                        router.push(`/explore/manga/${work.manga_id}`);
                      }}
                    >
                      <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <Book className="w-8 h-8 opacity-20" />
                        </div>
                        {/* Thay bằng <Image /> khi có link ảnh thật */}
                        <Image
                          src={work.cover_image || "/default-cover.png"}
                          alt={work.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-sky-600 transition-colors line-clamp-1">
                        {work.title}
                      </h4>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    )
  );
}
