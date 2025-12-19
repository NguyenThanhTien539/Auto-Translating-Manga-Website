"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/app/hooks/useAuth";
import { BookOpen, Plus } from "lucide-react";
import { SearchBar } from "./SearchBar";
import Filter, { MangaFilterValues } from "./Filter";
import { useState } from "react";

export default function Header() {
  const { infoUser, isLogin } = useAuth();
  const router = useRouter();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const handleOpenFilter = () => setIsFilterOpen(true);
  const handleCloseFilter = () => setIsFilterOpen(false);
  const handleSearch = (keyword: string) => {
    router.push(`/search?keyword=${encodeURIComponent(keyword)}`);
  };

  const handleApplyFilter = (values: MangaFilterValues) => {
    const sp = new URLSearchParams();
    console.log("Filter values to apply:", values);

    sp.set("chaptersMin", String(values.chaptersMin ?? 0));
    sp.set("chaptersMax", String(values.chaptersMax ?? 0));

    sp.set("state", values.state ?? "all");

    (values.categories ?? [])
      .filter(Boolean)
      .forEach((c) => sp.append("categories", c));

    handleCloseFilter();
    console.log("Applying filter with query:", sp.toString());
    router.push(`/filter?${sp.toString()}`);
  };

  return (
    <header className="w-full border-b border-black-800 mt-2 bg-white px-4 py-1 flex items-center justify-between gap-4">
      <div className="ml-[50px] flex items-center gap-2">
        <span
          className="text-[30px] font-semibold text-sky-700 cursor-pointer"
          onClick={() => router.push("/")}
        >
          Softwarriors
        </span>

        <div className="flex h-6 w-6 items-center justify-center rounded-md border border-sky-300 bg-sky-50 text-[15px] text-sky-700">
          <BookOpen className="w-4 h-4 cursor-pointer" onClick={() => router.push("/")} />
        </div>
      </div>

      {/* SearchBar giữa */}
      <SearchBar onSearch={handleSearch} onOpenFilter={handleOpenFilter} />

      {/* Right */}
      {isLogin ? (
        <>
          <div className="mr-[50px] flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src={infoUser?.avatar || "/image/logo.jpg"}
                alt={infoUser?.username || "Avatar"}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover border border-gray-200 cursor-pointer"
              />
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-gray-900">
                {infoUser?.username}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mr-[50px]">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-xl">🪙</span>
              <span className="text-sm font-semibold text-gray-900">
                {infoUser?.coin_balance ?? 0}
              </span>
            </div>

            <button
              type="button"
              className="cursor-pointer flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 hover:bg-amber-500 transition-colors shadow-sm"
              onClick={() => router.push("/order-coin/list")}
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </>
      ) : (
        <div className="mr-[50px] flex items-center gap-3">
          <button
            type="button"
            className="h-8 px-4 rounded-md bg-sky-700 text-white text-[15px] font-semibold hover:bg-sky-800 cursor-pointer"
            onClick={() => router.push("/account/login")}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className="text-[15px] text-gray-700 font-bold hover:text-gray-900 cursor-pointer"
            onClick={() => router.push("/account/register")}
          >
            Đăng ký
          </button>
        </div>
      )}

      {/* Overlay filter: login hay không đều mở được */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseFilter();
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl px-4 mt-4"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Filter onApply={handleApplyFilter} onCancel={handleCloseFilter} />
          </div>
        </div>
      )}
    </header>
  );
}
