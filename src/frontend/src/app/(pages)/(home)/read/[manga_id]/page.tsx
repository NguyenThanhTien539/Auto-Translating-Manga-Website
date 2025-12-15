"use client";

import React, { useState } from "react";
import { Eye, MessageCircle, Download, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Chapter {
  id: string;
  number: string;
  title?: string;
  views?: number;
}

const getMangaDetails = (manga_id: string) => {
  return {
    manga_id,
    manga_name: "One Piece",
    author: "Oda Eiichiro",
    coverUrl:
      "https://static.wikia.nocookie.net/onepiece/images/c/cd/Volume_98.png",
    description:
      "Long ago the infamous Gol D. Roger was the strongest and most powerful pirate on the seas. As he was about to be executed he revealed that he hid all of his wealth, including the legendary treasure known as One Piece, on an island at the end of the Grand Line - a treacherous and truly unpredictable sea. Monkey D. Luffy is a spirited, energetic, and somewhat dim-witted young man with a very big dream: to find One Piece and become the Pirate King! However Luffy is no ordinary boy, as when he was younger he ate one of the Devil's Fruits and gained its power to become a Rubber Man. Now in this grand age of pirates Luffy sets out to gather a crew and sail to the most dangerous sea in the world so that he can fulfill his dream... and maybe even his appetite!",
    genres: [
      "Action",
      "Adventure",
      "Comedy",
      "Fantasy",
      "Shounen",
      "Pirates",
      "SuperPowers",
      "Adapted to anime",
    ],
    status: "Ongoing",
    magazine: "Weekly Shonen Jump",
    publicationDate: "1997 - ?",
    rating: 9.32,
    rank: "#3",
    totalChapters: 1069,
  };
};

const getChapters = (manga_id: string): Chapter[] => {
  const chapters: Chapter[] = [];
  for (let i = 1012; i >= 999; i--) {
    chapters.push({
      id: `chapter-${i}`,
      number: `Chương ${i}`,
      views: Math.floor(Math.random() * 10000),
    });
  }
  return chapters;
};

export default function ReadPage() {
  const router = useRouter();

  const manga_id = "one-piece";
  const manga = getMangaDetails(manga_id);
  const chapters = getChapters(manga_id);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "chapters">(
    "overview"
  );
  const [myListStatus, setMyListStatus] = useState("Want to read");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Tabs Navigation */}
      <div className="sticky top-0 z-40 border-b border-slate-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-0">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 md:px-8 py-4 font-semibold transition-all text-center text-sm md:text-base border-r border-slate-700 ${
                activeTab === "overview"
                  ? "bg-white text-slate-900"
                  : "bg-slate-800/95 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setActiveTab("chapters")}
              className={`px-6 md:px-8 py-4 font-semibold transition-all text-center text-sm md:text-base ${
                activeTab === "chapters"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800/95 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Chương
            </button>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="relative overflow-hidden pt-8 pb-12">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Cover Image */}
            <div className="md:col-span-1 flex justify-center md:justify-start">
              <div className="relative w-48 h-72 rounded-xl overflow-hidden shadow-2xl border border-blue-500/20 hover:shadow-blue-500/20 transition-shadow">
                <Image
                  src={"/image/logo.jpg"}
                  alt={"manga cover"}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
            </div>

            {/* Manga Info */}
            <div className="md:col-span-3 text-white">
              <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                {manga.manga_name}
              </h1>
              <p className="text-lg text-slate-300 mb-6">{manga.author}</p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-700/50 backdrop-blur rounded-lg p-4 border border-slate-600">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                    Tập
                  </p>
                  <p className="text-2xl font-bold text-blue-400">104+</p>
                </div>
                <div className="bg-slate-700/50 backdrop-blur rounded-lg p-4 border border-slate-600">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                    Chương
                  </p>
                  <p className="text-2xl font-bold text-blue-400">
                    {manga.totalChapters}+
                  </p>
                </div>

                <div className="bg-slate-700/50 backdrop-blur rounded-lg p-4 border border-slate-600">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                    Đánh giá
                  </p>
                  <div className="flex items-center gap-2">
                    <Star
                      size={20}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <span className="text-2xl font-bold text-yellow-400">
                      {manga.rating}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Rank */}
              <div className="flex items-center gap-4">
                <span className="bg-blue-500/30 hover:bg-blue-500/40 text-blue-300 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-500/50 transition-colors">
                  {manga.status}
                </span>
                <span className="text-slate-300 font-semibold">
                  Rank {manga.rank}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        {/* Tab: Tổng quan */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Description */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:bg-slate-800/70 transition-colors">
              <h2 className="text-2xl font-bold text-white mb-4">Nội dung</h2>
              <p
                className={`text-slate-300 leading-relaxed ${
                  !showFullDescription ? "line-clamp-4" : ""
                }`}
              >
                {manga.description}
              </p>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-blue-400 hover:text-blue-300 font-semibold mt-4 text-sm transition-colors"
              >
                {showFullDescription ? "Thu gọn" : "Xem thêm"}
              </button>
            </div>

            {/* Genres */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Danh mục</h2>
              <div className="flex flex-wrap gap-3">
                {manga.genres.map((genre) => (
                  <button
                    key={genre}
                    className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Reading Status */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Danh sách của tôi
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  "Reading",
                  "Want to read",
                  "Stalled",
                  "Dropped",
                  "Won't read",
                ].map((status) => (
                  <button
                    key={status}
                    onClick={() => setMyListStatus(status)}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all text-sm ${
                      myListStatus === status
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50 border border-blue-400"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Chương */}
        {activeTab === "chapters" && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="border-b border-slate-700 hover:bg-blue-500/10 transition-colors"
                  onClick={() => {
                    router.push(`/read/${manga_id}/${chapter.id}`);
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {chapter.number}
                      </span>
                      <div className="flex items-center gap-6 text-slate-400">
                        <button className="hover:text-blue-400 transition-colors flex items-center gap-2">
                          <Eye size={18} />
                          <span className="text-xs">
                            {chapter.views?.toLocaleString()}
                          </span>
                        </button>
                        <button className="hover:text-blue-400 transition-colors">
                          <MessageCircle size={18} />
                        </button>
                        <button className="hover:text-blue-400 transition-colors">
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
