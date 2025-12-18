"use client";
import React, { useState } from "react";
import { Search, ListFilter, LayoutGrid, List } from "lucide-react";
import MangaCard from "@/app/components/client/MangaCard";

// Giả lập dữ liệu cho Favourite List
const MOCK_FAVOURITES = [
  {
    manga_id: "1",
    manga_name: "Berserk",
    author: "Kentaro Miura",
    original_language: "japanese",
    genre: "Action, Drama, Fantasy, Adventure",
    status: "Continuous",
    coverUrl: "https://example.com/berserk.jpg",
    rating: 9.32,
    totalChapters: 368,
  },
  // Thêm các item khác...
];

export default function FavouriteList() {
  const [activeTab, setActiveTab] = useState("Favourite");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState(MOCK_FAVOURITES); // Giả sử list đang có data

  const tabs = ["Reading", "Want to read", "Stalled", "Dropped", "Won't read", "Favourite"];

  return (
    <div className="min-h-screen p-6 text-gray-300">
      {/* 1. Top Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
              ${
                activeTab === tab
                  ? "bg-sky-700 text-white border-sky-600 shadow-lg shadow-sky-900/20"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2. Search & Toolbar Bar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-sky-500" />
          </div>
          <input
            type="text"
            placeholder="Search here"
            className="w-full bg-white text-gray-800 text-sm rounded-full py-2.5 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 right-3 flex items-center border-l border-gray-200 pl-2">
            <ListFilter className="w-4 h-4 text-gray-400 cursor-pointer hover:text-sky-600" />
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex gap-2">
          <button className="p-2 bg-white rounded shadow-sm text-gray-600 hover:text-sky-600">
            <List className="w-5 h-5" />
          </button>
          <button className="p-2 bg-sky-700 rounded shadow-sm text-white">
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Content Area */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((manga) => (
            <MangaCard key={manga.manga_id} {...manga} />
          ))}
        </div>
      ) : (
        /* 4. Empty State (Như hình số 2 bạn gửi) */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative w-48 h-48 mb-6 opacity-50">
             {/* Logo hoặc Illustration dấu hỏi như hình */}
             <div className="text-9xl font-bold text-gray-700 select-none">雪</div>
             <div className="absolute top-0 right-0 text-4xl animate-bounce">?</div>
          </div>
          <div className="bg-white px-10 py-3 rounded shadow-sm text-gray-600 font-medium">
            You have no elements in your "{activeTab}" list.
          </div>
        </div>
      )}
    </div>
  );
}