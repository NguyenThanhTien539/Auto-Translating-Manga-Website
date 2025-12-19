"use client";

import { useState, KeyboardEvent, useEffect } from "react";

type SearchBarProps = {
  onSearch: (keyword: string) => void;  // Header truyền logic search
  onOpenFilter: () => void;            // Header truyền hàm mở filter panel
};

export function SearchBar({ onSearch, onOpenFilter }: SearchBarProps) {
  const [keyword, setKeyword] = useState("");

  // delete keyword when reload page
  useEffect(() => {
    setKeyword("");
  }, []);

  const handleSearch = () => {
    const q = keyword.trim();
    if (!q) return;
    onSearch(q);
    setKeyword("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex-1 flex justify-center">
      <div className="flex items-center h-9 max-w-xl w-full rounded-full border border-gray-300 border-b-2 border-b-amber-400 bg-white px-2 shadow-sm">
        {/* Icon search */}
        <button
          type="button"
          className="mx-2 text-gray-400 text-[15px]"
          onClick={handleSearch}
        >
          🔍
        </button>

        {/* Input */}
        <input
          type="text"
          placeholder="Tìm theo tên truyện"
          className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Vạch ngăn + icon filter */}
        <div className="flex items-center gap-1 pl-2 ml-2 border-l border-gray-200">
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xs"
            onClick={onOpenFilter}       
          >
            ⏷
          </button>
        </div>
      </div>
    </div>
  );
}
