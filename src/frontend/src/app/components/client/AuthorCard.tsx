import React from "react";
import Link from "next/link";
import Image from "next/image";

interface AuthorCardProps {
  author_id: string | number;
  name: string;
  famous_work?: string;          // ví dụ: "Berserk"
  role?: string;                 // ví dụ: "Manga Artist"
  nationality?: string;          // ví dụ: "Japanese"
  born?: string;                 // ví dụ: "July 11, 1966"
  birthplace?: string;           // ví dụ: "Japan"
  lifespan?: string;             // ví dụ: "1966 - 2021" hoặc "1975 - Present"
  avatarUrl: string;
}

export default function AuthorCard({
  author_id,
  name,
  famous_work,
  role = "Manga Artist",
  nationality = "Japanese",
  born,
  birthplace,
  lifespan,
  avatarUrl,
}: AuthorCardProps) {
  return (
    <Link
      href={`/authors/${author_id}`}
      className="group block h-full transition-transform hover:scale-[1.02]"
    >
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
        {/* Top image */}
        <div className="relative h-56 w-full bg-gray-100 dark:bg-gray-700">
          <Image
            src={avatarUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {/* subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>

        {/* Blue name bar */}
        <div className="bg-sky-700 text-white px-4 py-3">
          <h3 className="font-bold text-sm sm:text-base leading-tight truncate" title={name}>
            {name}
          </h3>
          <p className="text-sky-200 text-xs mt-0.5 truncate">
            {famous_work || "—"}
          </p>
        </div>

        {/* Bottom info */}
        <div className="p-4 flex-1 flex flex-col justify-between bg-white dark:bg-gray-800">
          <div className="space-y-2">
            <div className="text-gray-800 dark:text-gray-100 font-semibold text-sm">
              {role}
            </div>

            <div className="text-gray-500 dark:text-gray-400 text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {nationality}
              </span>
              {birthplace ? ` • ${birthplace}` : ""}
            </div>

            {(born || lifespan) && (
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                {born ? (
                  <span>{born}</span>
                ) : (
                  <span className="italic">—</span>
                )}
                {lifespan ? (
                  <span className="block mt-1 text-gray-600 dark:text-gray-300 font-medium">
                    {lifespan}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Footer small accent line like the screenshot */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="h-1 w-16 rounded-full bg-sky-600/80" />
          </div>
        </div>
      </div>
    </Link>
  );
}
