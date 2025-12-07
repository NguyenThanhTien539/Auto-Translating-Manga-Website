// components/MangaFilterPanel.tsx
"use client";

import Loadable from "next/dist/shared/lib/loadable.shared-runtime";
import React, { useMemo, useState } from "react";

export type MangaFilterValues = {
  chaptersMin: number;
  chaptersMax: number;
  state: "all" | "complete" | "continuous";
  type: "all" | "manga" | "manhua" | "manhwa";
  categories: string[];
};

interface MangaFilterPanelProps {
  initialValues?: Partial<MangaFilterValues>;
  onApply: (values: MangaFilterValues) => void;
  onCancel?: () => void;
}

const MAX_CATEGORIES = 20;

const ALL_CATEGORIES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
];

const ALL_TYPES = [
              { value: "all", label: "All" },
              { value: "manga", label: "Manga" },
              { value: "manhua", label: "Manhua" },
              { value: "manhwa", label: "Manhwa" },
                  ];


const ALL_STATES = [
              {value: "completed", label: "Completed" },
              {value: "continuous", label: "Continuous"},
              {value: "all", label: "All"},
                   ];

const MIN_CHAPTERS_LIMIT = 0;
const MAX_CHAPTERS_LIMIT = 2000;

export default function Filter({
  initialValues,
  onApply,
  onCancel,
}: MangaFilterPanelProps) {
  const [chaptersMin, setChaptersMin] = useState(
    initialValues?.chaptersMin ?? 0
  );
  const [chaptersMax, setChaptersMax] = useState(
    initialValues?.chaptersMax ?? 255
  );
  const [state, setState] = useState<MangaFilterValues["state"]>(
    initialValues?.state ?? "all"
  );
  const [type, setType] = useState<MangaFilterValues["type"]>(
    initialValues?.type ?? "all"
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialValues?.categories ?? ALL_CATEGORIES.slice(0, 1)
  );
  const [categorySearch, setCategorySearch] = useState("");

  // filter categories theo search
  const visibleCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return ALL_CATEGORIES;
    return ALL_CATEGORIES.filter((c) =>
      c.toLowerCase().includes(q.toLowerCase())
    );
  }, [categorySearch]);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name)
        ? prev.filter((c) => c !== name)
        : [...prev, name]
    );
  };

  const handleApply = () => {
    const values: MangaFilterValues = {
      chaptersMin,
      chaptersMax,
      state,
      type,
      categories: selectedCategories,
    };
    onApply(values);
  };

  const handleCancel = () => {
    // tuỳ bạn muốn reset hay giữ state hiện tại
    if (onCancel) onCancel();
  };

  // helpers cho input number & slider
  const handleMinChange = (val: string) => {
    let num = Number(val) || 0;
    if (num < MIN_CHAPTERS_LIMIT) num = MIN_CHAPTERS_LIMIT;
    if (num > chaptersMax) num = chaptersMax;
    setChaptersMin(num);
  };

  const handleMaxChange = (val: string) => {
    let num = Number(val) || 0;
    if (num > MAX_CHAPTERS_LIMIT) num = MAX_CHAPTERS_LIMIT;
    if (num < chaptersMin) num = chaptersMin;
    setChaptersMax(num);
  };

  const [shouldSliderChangeMin, setShouldSliderChangeMin] = useState(false)

  return (
    <div className="w-full max-w-5xl mx-auto bg-white text-gray-900 rounded-xl shadow-lg border border-gray-200 p-6 space-y-8">
      {/* Chapters */}
      <section>
        <h2 className="font-semibold mb-3">Number of Chapters -</h2>

        <div className="flex flex-col gap-4">
          {/* min / max input */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">min</span>
              <input
                type="number"
                className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm"
                value={chaptersMin}
                onChange={(e) => handleMinChange(e.target.value)}
                onClick={() => {setShouldSliderChangeMin(true)}}
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">max</span>
              <input
                type="number"
                className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm"
                value={chaptersMax}
                onChange={(e) => handleMaxChange(e.target.value)}
                onClick={() => {setShouldSliderChangeMin(false)}}
              />
            </div>
          </div>

          {/* slider + current value */}
          <div className="space-y-2">
            <div className="text-center text-sm font-semibold">
              {/* {chaptersMax} */}
            </div>
            <input
              type="range"
              min={MIN_CHAPTERS_LIMIT}
              max={MAX_CHAPTERS_LIMIT}
              value={shouldSliderChangeMin ? chaptersMin : chaptersMax}
              onChange={(e) => {shouldSliderChangeMin ? handleMinChange(e.target.value) : handleMaxChange(e.target.value)}}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{MIN_CHAPTERS_LIMIT}</span>
              <span>{MAX_CHAPTERS_LIMIT}</span>
            </div>
          </div>
        </div>
      </section>

      {/* State & Type */}
      <section className="flex flex-wrap gap-8">
        {/* State */}
        <div className="space-y-3">
          <h2 className="font-semibold">State -</h2>
          <div className="flex gap-3">
            {ALL_STATES.map((s) => {
              const active = state === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() =>
                    setState(
                      state === s.value ? "all" : (s.value as any)
                    )
                  }
                  className={
                    "px-4 py-2 rounded-md border text-sm transition " +
                    (active
                      ? "bg-[#1e6091] text-white border-[#1e6091]"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50")
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block h-16 w-px bg-gray-300 self-center" />

        {/* Type */}
        <div className="space-y-3">
          <h2 className="font-semibold">Type -</h2>
          <div className="flex flex-wrap gap-3">
            {ALL_TYPES.map((t) => {
              const active = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value as any)}
                  className={
                    "px-4 py-2 rounded-md border text-sm transition " +
                    (active
                      ? "bg-[#1e6091] text-white border-[#1e6091]"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50")
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-3">
        <h2 className="font-semibold">Categories -</h2>

        {/* selected pills */}
        <div className="flex flex-wrap gap-3 mb-2">
          {selectedCategories.slice(0, MAX_CATEGORIES).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#1e6091] text-white border-b-4 border-[#f6aa1c] shadow-sm"
            >
              {cat}
            </button>
          ))}
          {selectedCategories.length === 0 && (
            <span className="text-xs text-gray-400">
              Chưa chọn category nào.
            </span>
          )}
        </div>

        {/* search box */}
        <div className="w-full">
          <input
            type="text"
            placeholder="Search here"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
          />
        </div>

        {/* category chips list */}
        <div className="max-h-40 overflow-y-auto mt-2 border border-gray-200 rounded-md p-2">
          <div className="flex flex-wrap gap-2">
            {visibleCategories.map((cat) => {
              const active = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={
                    "px-4 py-1.5 rounded-md text-xs border transition " +
                    (active
                      ? "bg-[#1e6091] text-white border-[#1e6091]"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50")
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          className="min-w-[120px] px-4 py-2 rounded-md border border-[#f6aa1c] text-sm font-semibold bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="min-w-[120px] px-4 py-2 rounded-md border border-[#f6aa1c] text-sm font-semibold bg-[#1e6091] text-white hover:bg-[#174b71]"
        >
          Filter
        </button>
      </section>
    </div>
  );
}
