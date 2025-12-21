import React from "react";
import Link from "next/link";
import Image from "next/image";

interface MangaCardProps {
  manga_id: string;
  manga_name: string;
  author: string;
  original_language: string;
  genre: string;
  status: string;
  coverUrl: string;
  average_rating: number;
  totalChapters: number;
}

export default function MangaCard({
  manga_id,
  manga_name,
  author,
  genre,
  status,
  coverUrl,
  average_rating,
  totalChapters,
}: MangaCardProps) {
  const formattedGenre = genre ? genre.replace(/,/g, " - ") : "";

  return (
    <Link
      href={`/read/${manga_id}`}
      className="group block h-full transition-transform hover:scale-105"
    >
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
        {/* Cover Image */}
        <div className="relative h-100 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={coverUrl}
            alt={manga_name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        {/* Title & Author */}
        <div className="flex flex-col bg-sky-700 p-3 text-white">
          <h3
            className="font-bold text-sm line-clamp-2 leading-tight"
            title={manga_name}
          >
            {manga_name}CCCC
          </h3>
          <p className="text-sky-200 text-xs mt-1 truncate">{author}</p>
        </div>

        {/* Details */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          <div>
            <p className="text-sky-700 dark:text-sky-400 font-semibold text-sm mb-1">
              {totalChapters} Chương
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2">
              {formattedGenre}
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-medium capitalize">
              {status}
            </span>

            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-gray-800 dark:text-gray-200 font-bold text-sm">
                {average_rating ? average_rating.toFixed(1) : "0"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
