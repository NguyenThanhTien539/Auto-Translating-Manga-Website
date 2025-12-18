import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Book, MapPin, Calendar, Globe } from "lucide-react"; // Cài đặt: npm install lucide-react

// Giả lập hàm lấy dữ liệu từ DB/API
async function getAuthorData(id: string) {
  // Thay thế bằng fetch(`your-api/authors/${id}`)
  return {
    id,
    name: "Kentaro Miura",
    famous_work: "Berserk",
    role: "Manga Artist",
    nationality: "Japanese",
    born: "July 11, 1966",
    birthplace: "Chiba, Japan",
    lifespan: "1966 - 2021",
    avatarUrl: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=1000", // Link minh họa
    bio: "Kentaro Miura was a Japanese manga artist. He was best known for his acclaimed dark fantasy manga series Berserk, which began serialization in 1989 and continued until his death.",
    works: [
      { id: 1, title: "Berserk", year: "1989", cover: "/covers/berserk.jpg" },
      { id: 2, title: "Gigantomakhia", year: "2013", cover: "/covers/giganto.jpg" },
      { id: 3, title: "Duranki", year: "2019", cover: "/covers/duranki.jpg" },
    ]
  };
}

export default async function AuthorDetailPage({ params }: { params: { id: string } }) {
  const author = await getAuthorData(params.id);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      {/* Header / Navigation */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">
          <Link 
            href="/authors" 
            className="flex items-center text-sm font-medium text-sky-700 dark:text-sky-400 hover:underline"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại danh sách
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Cột trái: Ảnh và thông tin nhanh */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={author.avatarUrl}
                  alt={author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5 space-y-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  {author.name}
                </h1>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                    <Globe className="w-4 h-4 mr-3 text-sky-600" />
                    <span>{author.nationality}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                    <MapPin className="w-4 h-4 mr-3 text-sky-600" />
                    <span>{author.birthplace}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                    <Calendar className="w-4 h-4 mr-3 text-sky-600" />
                    <span>{author.lifespan}</span>
                  </div>
                </div>
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
                {author.bio}
              </p>
            </section>

            {/* Section: Famous Works */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="w-1 h-6 bg-sky-600 rounded-full mr-3"></span>
                Tác phẩm tiêu biểu
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {author.works.map((work) => (
                  <div key={work.id} className="group cursor-pointer">
                    <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 overflow-hidden border border-gray-200 dark:border-gray-700">
                       <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                         <Book className="w-8 h-8 opacity-20" />
                       </div>
                       {/* Thay bằng <Image /> khi có link ảnh thật */}
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-sky-600 transition-colors line-clamp-1">
                      {work.title}
                    </h4>
                    <p className="text-xs text-gray-500">{work.year}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      </div>
    </main>
  );
}