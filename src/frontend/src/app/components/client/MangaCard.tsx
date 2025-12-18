import React from 'react';
import Link from 'next/link';


interface MangaCardProps extends React.HTMLAttributes<HTMLElement> {
    // --- Props from Database (ERD) ---
    manga_id: string;
    manga_name: string;
    author: string;
    original_language: string;
    genre: string;
    status: string;
    publication_date: Date;
    
    // --- UI Specific Props (Design) ---
    coverUrl: string;      // Image URL
    rating: number;        // e.g., 8.91
    chapter: number; // e.g., 4
}

export function MangaCard1({
    manga_id,
    manga_name,
    author,
    original_language,
    genre,
    status,
    publication_date,
    coverUrl,
    rating,
    chapter,
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
                {chapter} Chương
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
    </Link>);
};

function calculateDuration(publicationDate: Date): string {
    const now = new Date();
    const durationMs = now.getTime() - publicationDate.getTime();
    const duration = new Date(durationMs);
    var result = '';
    if (duration.getFullYear() - 1970 > 0) {
        result += `${duration.getFullYear() - 1970} năm, `;
    }
    if (duration.getMonth() > 0) {
        result += `${duration.getMonth()} tháng, `;
    }
    if (duration.getDate() - 1 > 0) {
        result += `${duration.getDate() - 1} ngày, `;
    }
    if (duration.getHours() > 0) {
        result += `${duration.getHours()} giờ, `;
    }
    if (duration.getMinutes() > 0) {
        result += `${duration.getMinutes()} phút `;
    }
    result += 'trước';
    return result;
}

export function MangaCard2({
    manga_id,
    manga_name,
    author,
    original_language,
    genre,
    status,
    publication_date,
    coverUrl,
    rating,
    chapter,
    ...props
}: MangaCardProps) {
    var duration = new Date(Date.now() - publication_date.getTime());

    return (
        <Link
            href={`/read/${manga_id}`}
            className="block w-full h-full flex-shrink-0"
            aria-label={`Read ${manga_name}`}
            {...props}
        >
            <div className='flex flex-row w-full h-full bg-[#1B6FA8] rounded-r-lg'>
                <img 
                    src={coverUrl} 
                    alt={manga_name} 
                    className="w-[10%] h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                {/* Details */}
                <div className='w-full h-full flex flex-col p-2 gap-0.5'>
                    <div className=''>
                        <h3
                            className="font-bold text-white text-sm line-clamp-2 flex leading-tight"
                            title={manga_name}
                        >
                            {manga_name}
                        </h3>
                        <p className="text-[#FAFCFC] opacity-[75%] font-bold text-xs mt-1 truncate">
                            {author}
                        </p>
                    </div>
                    <div className='flex flex-row gap-2 mt-auto'>
                        <div className='w-fit px-4 pt-1 pb-1.5 rounded-[5] bg-white text-sm'>
                            {genre}
                        </div>
                        <div className='w-fit px-4 pt-1 pb-1.5 rounded-[5] bg-white text-sm'>
                            Chương
                            <span className='text-[#1B6FA8]'> {chapter}</span>
                        </div>
                    </div>
                    <div className="h-[20%] flex items-center gap-1 py-1">
                        <svg height="100%" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.6827 5.16688C9.6827 7.54355 7.71087 9.47244 5.28129 9.47244C2.85171 9.47244 0.879883 7.54355 0.879883 5.16688C0.879883 2.79022 2.85171 0.861328 5.28129 0.861328C7.71087 0.861328 9.6827 2.79022 9.6827 5.16688Z" stroke="#FAFCFC" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6.91492 6.53576L5.55048 5.73923C5.3128 5.60145 5.11914 5.26993 5.11914 4.99868V3.2334" stroke="#FAFCFC" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className='text-white text-xs pb-[1px]'>
                            {calculateDuration(publication_date)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-yellow-400 text-sm">★</span>
                        <span className="text-white dark:text-gray-200 font-bold text-sm">
                            {rating.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}