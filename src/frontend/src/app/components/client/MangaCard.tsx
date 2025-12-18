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
  rating: number;
  totalChapters: number;
}

export default function MangaCard({
  manga_id,
  manga_name,
  author,
  original_language,
  genre,
  status,
  coverUrl,
  rating,
  totalChapters,
}: MangaCardProps) {
  const getFlagEmoji = (lang: string): string => {
    const lowerLang = lang?.toLowerCase() || "";
    if (lowerLang.includes("japan")) return "🇯🇵";
    if (lowerLang.includes("korea")) return "🇰🇷";
    if (lowerLang.includes("china")) return "🇨🇳";
    if (lowerLang.includes("vietnam")) return "🇻🇳";
    return "🏳️";
  };

  const formattedGenre = genre ? genre.replace(/,/g, " - ") : "";

  return (
    <Link
      href={`/read/${manga_id}`}
      className="group block h-full transition-transform hover:scale-105"
    >
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
        {/* Cover Image */}
        <div className="relative h-100 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
          <div className="absolute top-2 left-2 bg-white/95 text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 z-10 text-gray-800">
            <span>{getFlagEmoji(original_language)}</span>
            <span className="uppercase tracking-wide">Manga</span>
          </div>

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
            {manga_name}
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
                {rating.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
