/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthorCard from "@/app/components/client/AuthorCard";

// Fake data (fallback)
const EXPLORE_AUTHOR_DATA = [
  {
    author_id: "1",
    name: "Kentaro Miura",
    famous_work: "Berserk",
    role: "Manga Artist",
    nationality: "Japanese",
    born: "July 11, 1966",
    birthplace: "Japan",
    lifespan: "1958 - 2021",
    avatarUrl: "/image/logo.jpg",
  },
  {
    author_id: "2",
    name: "Eiichiro Oda",
    famous_work: "One piece",
    role: "Manga Artist",
    nationality: "Japanese",
    born: "January 1, 1975",
    birthplace: "Japan",
    lifespan: "1975 - Present",
    avatarUrl: "/image/logo.jpg",
  },
  {
    author_id: "3",
    name: "Turtleme",
    famous_work: "The beginning after the ..",
    role: "Manhua Artist",
    nationality: "Korean",
    born: "May 29, 1993",
    birthplace: "Japan",
    lifespan: "1993 - Present",
    avatarUrl: "/image/logo.jpg",
  },
  {
    author_id: "4",
    name: "Hajime Isayama",
    famous_work: "Berserk",
    role: "Manga Artist",
    nationality: "Japanese",
    born: "August 29, 1986",
    birthplace: "Japan",
    lifespan: "1986 - Present",
    avatarUrl: "/image/logo.jpg",
  },
  {
    author_id: "5",
    name: "ONE",
    famous_work: "One punch man",
    role: "Manga Artist",
    nationality: "Japanese",
    born: "October 29, 1986",
    birthplace: "Japan",
    lifespan: "1986 - Present",
    avatarUrl: "/image/logo.jpg",
  },
];

type Author = {
  author_id: string;
  name: string;
  famous_work?: string;
  role?: string;
  nationality?: string;
  born?: string;
  birthplace?: string;
  lifespan?: string;
  avatar_url?: string; // từ API
};

export default function AuthorsPage() {
  const router = useRouter();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/authors/all`)
      .then((res) => res.json())
      .then((data) => {
        setAuthors(data || []);
      })
      .catch(() => setAuthors([]))
      .finally(() => setLoading(false));
  }, []);

  const authorsForUI =
    authors.length > 0 ? (authors as any) : (EXPLORE_AUTHOR_DATA as any);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-500">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {authorsForUI.map((a: any) => (
          <div
            key={String(a.author_id)}
            className="cursor-pointer"
            onClick={() => router.push(`/authors/${a.author_id}`)}
          >
            <AuthorCard
              author_id={a.author_id}
              author_name={a.author_name}
              famous_work={a.famous_work}
              avatar_url={a.avatar_url}
            />
          </div>
        ))}
      </div>

      {authorsForUI.length === 0 && (
        <div className="mt-8 text-center text-gray-500 dark:text-gray-200">
          Không có tác giả nào.
        </div>
      )}
    </div>
  );
}
