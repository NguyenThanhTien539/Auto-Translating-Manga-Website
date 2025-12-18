// app/manga/page.tsx
import React from "react";
import MangaCard from "@/app/components/client/MangaCard";

const dummyMangaList = [
  {
    manga_id: "1",
    manga_name: "The Rising Hero of Another World",
    author: "Kazuya Tanaka",
    original_language: "Japan",
    genre: "Action, Fantasy, Adventure",
    status: "On-going",
    coverUrl: "https://i0.wp.com/www.glenatmanga.com/wp-content/uploads/2023/11/Spy-x-Family-Vol.-10.jpg?fit=500%2C750&ssl=1",
    rating: 8.91,
    totalChapters: 24,
  },
  {
    manga_id: "2",
    manga_name: "Moonlight Swordmaster",
    author: "Kim Haneul",
    original_language: "Korea",
    genre: "Action, Martial Arts, Fantasy",
    status: "On-going",
    coverUrl: "https://i0.wp.com/www.glenatmanga.com/wp-content/uploads/2023/11/Spy-x-Family-Vol.-10.jpg?fit=500%2C750&ssl=1",

    rating: 9.12,
    totalChapters: 57,
  },
  {
    manga_id: "3",
    manga_name: "Dragon Emperor’s Daughter",
    author: "Li Wei",
    original_language: "Chinese",
    genre: "Fantasy, Drama, Romance",
    status: "Completed",
    overUrl: "https://i0.wp.com/www.glenatmanga.com/wp-content/uploads/2023/11/Spy-x-Family-Vol.-10.jpg?fit=500%2C750&ssl=1",
    rating: 8.45,
    totalChapters: 40,
  },
  {
    manga_id: "4",
    manga_name: "Hello",
    author: "Nguyen Van A",
    original_language: "Vietnamese",
    genre: "Fantasy, School, Supernatural",
    status: "On-going",
    coverUrl: "https://i0.wp.com/www.glenatmanga.com/wp-content/uploads/2023/11/Spy-x-Family-Vol.-10.jpg?fit=500%2C750&ssl=1",
    rating: 8.77,
    totalChapters: 18,
  },
  {
    manga_id: "5",
    manga_name: "Cyber City Chronicles",
    author: "Akiro Sato",
    original_language: "Japan",
    genre: "Sci-Fi, Action, Thriller",
    status: "On-going",
    coverUrl: "https://i0.wp.com/www.glenatmanga.com/wp-content/uploads/2023/11/Spy-x-Family-Vol.-10.jpg?fit=500%2C750&ssl=1",

    rating: 9.01,
    totalChapters: 32,
  },
];

export default function MangaDummyPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Tiêu đề trang */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Kết quả tìm kiếm
            </h1>
          </div>
        </header>

        {/* Grid danh sách card */}
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {dummyMangaList.map((manga) => (
            <MangaCard
              key={manga.manga_id}
              manga_id={manga.manga_id}
              manga_name={manga.manga_name}
              author={manga.author}
              original_language={manga.original_language}
              genre={manga.genre}
              status={manga.status}
              coverUrl={manga.coverUrl ?? "/images/placeholder-cover.jpg"}
              rating={manga.rating}
              totalChapters={manga.totalChapters}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
