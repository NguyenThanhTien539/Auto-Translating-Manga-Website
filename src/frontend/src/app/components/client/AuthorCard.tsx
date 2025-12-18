import React from "react";
import Link from "next/link";
import Image from "next/image";

// Interface khớp với dữ liệu trả về từ API (Database bảng authors)
interface AuthorCardProps {
  // Các trường trực tiếp từ Database
  author_id: number;
  author_name: string;
  avatar_url: string;
  biography?: string; // Có trong DB

  // Các trường bổ sung để giữ Style (có thể tính toán từ DB hoặc để default)
  famous_work?: string;        // Ví dụ: lấy manga nổi bật nhất của tác giả
  role?: string;               // Mặc định: "Manga Artist"
  nationality?: string;        // Mặc định: "Japanese"
  birthplace?: string;         
  birth_date?: string;         // Format từ ngày sinh nếu có
  lifespan?: string;           
}

export default function AuthorCard({
  author_id,
  author_name,
  avatar_url,
  // Các giá trị mặc định để giữ nguyên Style nếu DB chưa có dữ liệu này
  famous_work,
  role = "Manga Artist",
  nationality = "Japanese",
  birthplace,
  birth_date,
  lifespan,
}: AuthorCardProps) {
  
  return (
    <Link
      href={`/authors/${author_id}`}
      className="group block h-full transition-transform hover:scale-[1.02]"
    >
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
        
        {/* Top image - Sử dụng avatar_url từ DB */}
        <div className="relative h-56 w-full bg-gray-100 dark:bg-gray-700">
          <Image
            src={avatar_url || "/images/default-author.png"} // Fallback nếu url null
            alt={author_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {/* subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </div>

        {/* Blue name bar - Sử dụng author_name */}
        <div className="bg-sky-700 text-white px-4 py-3">
          <h3 className="font-bold text-sm sm:text-base leading-tight truncate" title={author_name}>
            {author_name}
          </h3>
          <p className="text-sky-200 text-xs mt-0.5 truncate">
            {famous_work || "—"}
          </p>
        </div>

        {/* Bottom info - Giữ nguyên style */}
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

            {(birth_date || lifespan) && (
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                {birth_date ? (
                  <span>{birth_date}</span>
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

          {/* Footer small accent line */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="h-1 w-16 rounded-full bg-sky-600/80" />
          </div>
        </div>
      </div>
    </Link>
  );
}