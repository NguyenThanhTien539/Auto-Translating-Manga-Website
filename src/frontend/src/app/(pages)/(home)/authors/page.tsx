/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthorCard from "@/app/components/client/AuthorCard";

type Author = {
  author_id: string;
  author_name: string;
  avatar_url?: string;
  biography?: string;
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
        if (data.code === "success") {
          setAuthors(data.data);
        } else {
          setAuthors([]);
        }
      })
      .catch(() => setAuthors([]))
      .finally(() => setLoading(false));
  }, []);

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
        {authors.map((a: any) => (
          <div
            key={String(a.author_id)}
            className="cursor-pointer"
            onClick={() => router.push(`/authors/${a.author_id}`)}
          >
            <AuthorCard
              author_id={a.author_id}
              author_name={a.author_name}
              avatar_url={a.avatar_url}
              biography={a.biography}
            />
          </div>
        ))}
      </div>

      {authors.length === 0 && (
        <div className="mt-8 text-center text-gray-500 dark:text-gray-200">
          Không có tác giả nào.
        </div>
      )}
    </div>
  );
}
