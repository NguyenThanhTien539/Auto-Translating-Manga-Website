"use client";

import MangaCard from "@/app/components/client/MangaCard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// Dữ liệu giả phong phú cho trang explore
const EXPLORE_MANGA_DATA = [
  {
    manga_id: "1",
    manga_name: "One Piece",
    author: "Eiichiro Oda",
    original_language: "Japan",
    genre: "Adventure - Action - Comedy - Fantasy",
    status: "Ongoing",
    coverUrl: "/image/logo.jpg",
    rating: 9.26,
    totalChapters: 1100,
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
    totalChapters: 179,
  },
  {
    manga_id: "3",
    manga_name: "Versatile Mage",
    author: "Chaos",
    original_language: "China",
    genre: "Action - Fantasy - School Life",
    status: "Ongoing",
    coverUrl: "/image/logo.jpg",
    rating: 8.78,
    totalChapters: 810,
  },
  {
    manga_id: "4",
    manga_name: "Berserk",
    author: "Kentaro Miura",
    original_language: "Japan",
    genre: "Dark Fantasy - Drama - Horror - Action",
    status: "Continuous",
    coverUrl: "/image/logo.jpg",
    rating: 9.32,
    totalChapters: 374,
  },
  {
    manga_id: "5",
    manga_name: "The Beginning After The End",
    author: "TurtleMe",
    original_language: "Korea",
    genre: "Action - Fantasy - Adventure - Drama",
    status: "Ongoing",
    coverUrl: "/image/logo.jpg",
    rating: 9.05,
    totalChapters: 178,
  },
  {
    manga_id: "6",
    manga_name: "Chainsaw Man",
    author: "Tatsuki Fujimoto",
    original_language: "Japan",
    genre: "Action - Horror - Dark Fantasy",
    status: "Ongoing",
    coverUrl: "/image/logo.jpg",
    rating: 8.92,
    totalChapters: 158,
  },
  {
    manga_id: "7",
    manga_name: "Jujutsu Kaisen",
    author: "Gege Akutami",
    original_language: "Japan",
    genre: "Action - Dark Fantasy - Supernatural",
    status: "Ongoing",
    coverUrl: "/image/logo.jpg",
    rating: 8.88,
    totalChapters: 245,
  },
  {
    manga_id: "8",
    manga_name: "Tower of God",
    author: "SIU",
    original_language: "Korea",
    genre: "Action - Fantasy - Mystery - Drama",
    status: "Ongoing",
    coverUrl: "/image/logo.jpg",
    rating: 8.95,
    totalChapters: 585,
  },
  {
    manga_id: "9",
    manga_name: "Demon Slayer",
    author: "Koyoharu Gotouge",
    original_language: "Japan",
    genre: "Action - Adventure - Fantasy - Drama",
    status: "Completed",
    coverUrl: "/image/logo.jpg",
    rating: 8.76,
    totalChapters: 205,
  },
  {
    manga_id: "10",
    manga_name: "My Hero Academia",
    author: "Kohei Horikoshi",
    original_language: "Japan",
    genre: "Action - Adventure - Superhero",
    status: "Ongoing",
    coverUrl: "/image/logo.jpg",
    rating: 8.65,
    totalChapters: 410,
  },
];

type Manga = {
  manga_id: string;
  title: string;
  author_name: string;
  original_language: string;
  genres: string[];
  status: string;
  cover_image: string;
  rating: number;
  total_chapters: number;
};
export default function Explore() {
  const [allMangas, setAllMangas] = useState<Manga[]>([]);
  const router = useRouter();
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/all`)
      .then((response) => response.json())
      .then((data) => {
        if (data.code === "success") {
          setAllMangas(data.mangas);
        } else {
          setAllMangas([]);
        }
      });
  }, []);

  return (
    <>
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-500 ">
        {/* Popular this month */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Popular <span className="text-amber-500">this month</span>
            </h2>
            <button className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 font-medium">
              See More
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allMangas.map((manga) => (
              <div
                key={manga.manga_id}
                onClick={() => router.push(`/read/${manga.manga_id}`)}
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
                  rating={4.5}
                  totalChapters={manga?.total_chapters}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Recent uploads */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent <span className="text-amber-500">uploads</span>
            </h2>
            <button className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 font-medium">
              See More
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {EXPLORE_MANGA_DATA.slice(5, 10).map((manga) => (
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
        </section>

        {/* All Manga */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Tất cả truyện
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {EXPLORE_MANGA_DATA.map((manga) => (
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
        </section>

        {/* Load More Button */}
        <div className="flex justify-center pt-4">
          <button className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors shadow-md">
            Tải thêm truyện
          </button>
        </div>
      </div>
    </>
  );
}
