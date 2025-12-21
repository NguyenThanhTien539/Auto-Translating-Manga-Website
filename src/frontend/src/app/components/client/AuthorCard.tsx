import React from "react";
import Link from "next/link";
import Image from "next/image";

interface AuthorCardProps {
  author_id: number;
  author_name: string;
  avatar_url?: string;
  biography?: string;
}

export default function AuthorCard({
  author_id,
  author_name,
  avatar_url,
  biography,
}: AuthorCardProps) {
  const hasImage = avatar_url && avatar_url.trim() !== "";
  const hasBiography = biography && biography.trim() !== "";

  return (
    <Link
      href={`/authors/${author_id}`}
      className="group block h-full transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
    >
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
        {/* Avatar Section - Full Width Rectangle */}
        <div className="relative w-full h-56 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          {hasImage ? (
            <Image
              src={avatar_url}
              alt={author_name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700">
              <span className="text-gray-400 dark:text-gray-500 text-sm">
                Chưa cập nhật ảnh
              </span>
            </div>
          )}
        </div>

        {/* Info Section - White Background */}
        <div className="flex-1 px-5 py-5 bg-white dark:bg-gray-800 flex flex-col">
          {/* Author Name */}
          <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 mb-2 line-clamp-2">
            {author_name}
          </h3>

          {/* Biography / Description */}
          <div className="flex-1">
            {hasBiography ? (
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                {biography}
              </p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Chưa cập nhật tiểu sử
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
