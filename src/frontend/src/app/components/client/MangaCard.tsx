import React from 'react';
import Link from 'next/link';
// If you have configured domains in next.config.js, you can use 'next/image'
// import Image from 'next/image'; 

interface MangaCardProps extends React.HTMLAttributes<HTMLElement> {
  // --- Props from Database (ERD) ---
  manga_id: string;
  manga_name: string;
  author: string;
  original_language: string;
  genre: string;
  status: string;
  
  // --- UI Specific Props (Design) ---
  coverUrl: string;      // Image URL
  rating: number;        // e.g., 8.91
  totalChapters: number; // e.g., 4
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
	...props
}: MangaCardProps) {
  
  // Helper to determine flag based on language string
  const getFlagEmoji = (lang: string): string => {
    const lowerLang = lang ? lang.toLowerCase() : '';
    if (lowerLang.includes('japan')) return '🇯🇵'; // Japan
    if (lowerLang.includes('korea')) return '🇰🇷'; // Korea
    if (lowerLang.includes('china')) return '🇨🇳'; // China
    if (lowerLang.includes('vietnam')) return '🇻🇳'; // Vietnam
    return '🏳️'; // Default
  };

  // Format genre string: Replace commas with hyphens for cleaner look
  const formattedGenre = genre ? genre.replace(/,/g, ' - ') : '';

  return (
    <Link 
      href={`/read/${manga_id}`} 
      className="group block w-[100%] h-[100%] flex-shrink-0"
      aria-label={`Read ${manga_name}`}
			{...props}
			// style={{ display: "block", height: '500px' }}
    >
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
        
        {/* --- Cover Image Section --- */}
        <div className="h-full w-full overflow-hidden">
          {/* Language Badge (Top-left) */}
          <div className="absolute top-2 left-2 bg-white/95 text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 z-10 text-gray-800">
            <span>{getFlagEmoji(original_language)}</span>
            <span className="uppercase tracking-wide">Manga</span>
          </div>

          {/* Image */}
          <img 
            src={coverUrl} 
            alt={manga_name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>

        {/* --- Blue Info Banner (Title & Author) --- */}
        {/* Using the specific blue color from your design (#1e6091 usually matches that blue) */}
        <div className="flex flex-col bg-[#1e6091] p-3 text-center text-white gap-[2px]">
          <h3 
            className="font-bold text-sm line-clamp-2  flex items-center justify-center leading-tight"
            title={manga_name}
          >
            {manga_name}
          </h3>
          <p className="text-blue-200 text-xs mt-1 truncate">
            {author}
          </p>
        </div>

        {/* --- Details Section (Chapters, Genre, Status, Rating) --- */}
        <div className="p-2 h-fit flex-grow flex flex-col justify-between bg-white dark:bg-gray-800">
          <div>
            {/* Chapter Count */}
            <p className="text-[#1e6091] dark:text-blue-400 font-semibold text-sm mb-1">
              {totalChapters} Chapters
            </p>
            {/* Genre */}
            <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2">
              {formattedGenre}
            </p>
          </div>

          {/* Footer: Status and Rating */}
          <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {/* Status */}
            <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">
              {status}
            </span>
            
            {/* Rating */}
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
};