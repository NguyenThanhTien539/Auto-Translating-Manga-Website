"use client";

import React, { useEffect, useMemo, useState } from "react";

export type MangaFilterValues = {
  chaptersMin: number;
  chaptersMax: number;
  state: string;        // m.status hoặc "all"
  categories: string[]; // genre_name[]
};

interface MangaFilterPanelProps {
  initialValues?: Partial<MangaFilterValues>;
  onApply: (values: MangaFilterValues) => void;
  onCancel?: () => void;
}

type FilterPanelData = {
  status: { status: string | null }[];
  genres: { genre_id?: number | string | null; genre_name?: string | null }[];
};

const MIN_CHAPTERS_LIMIT = 0;
const MAX_CHAPTERS_LIMIT = 2000;
const MAX_CATEGORIES = 20;

export default function Filter({
  initialValues,
  onApply,
  onCancel,
}: MangaFilterPanelProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const [loading, setLoading] = useState(true);
  const [panelData, setPanelData] = useState<FilterPanelData>({
    status: [],
    genres: [],
  });

  // ---- local values
  const [chaptersMin, setChaptersMin] = useState<number>(
    initialValues?.chaptersMin ?? 0
  );
  const [chaptersMax, setChaptersMax] = useState<number>(
    initialValues?.chaptersMax ?? 255
  );

  const [state, setState] = useState<string>(initialValues?.state ?? "all");

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialValues?.categories ?? []
  );

  const [categorySearch, setCategorySearch] = useState("");
  const [shouldSliderChangeMin, setShouldSliderChangeMin] = useState(false);

  // ---- fetch filter panel data
  useEffect(() => {
    if (!API_URL) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`${API_URL}/manga/filterPanelData`, {
      signal: controller.signal,
      credentials: "include",
    })
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        return { ok: r.ok, json };
      })
      .then(({ ok, json }) => {
        if (ok && json?.code === "success" && json?.data) {
          // ✅ chỉ lấy đúng 2 field cần dùng
          setPanelData({
            status: Array.isArray(json.data.status) ? json.data.status : [],
            genres: Array.isArray(json.data.genres) ? json.data.genres : [],
          });
        } else {
          setPanelData({ status: [], genres: [] });
        }
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setPanelData({ status: [], genres: [] });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [API_URL]);

  // ---- options normalize
  const statusOptions = useMemo(() => {
    const list = (panelData.status || [])
      .map((x) => x?.status?.trim())
      .filter((x): x is string => !!x);
    return Array.from(new Set(list));
  }, [panelData.status]);

  const genreOptions = useMemo(() => {
    const list = (panelData.genres || [])
      .map((g) => g?.genre_name?.trim())
      .filter((x): x is string => !!x);
    return Array.from(new Set(list));
  }, [panelData.genres]);

  const visibleGenres = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return genreOptions;
    return genreOptions.filter((name) => name.toLowerCase().includes(q));
  }, [genreOptions, categorySearch]);

  // ---- actions
  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const handleApply = () => {
    const cleanedCategories = Array.from(
      new Set(selectedCategories.map((x) => x.trim()).filter(Boolean))
    );

    onApply({
      chaptersMin,
      chaptersMax,
      state,
      categories: cleanedCategories,
    });
  };

  const handleMinChange = (val: string) => {
    let num = Number(val);
    if (!Number.isFinite(num)) num = 0;
    if (num < MIN_CHAPTERS_LIMIT) num = MIN_CHAPTERS_LIMIT;
    if (num > chaptersMax) num = chaptersMax;
    setChaptersMin(num);
  };

  const handleMaxChange = (val: string) => {
    let num = Number(val);
    if (!Number.isFinite(num)) num = 0;
    if (num > MAX_CHAPTERS_LIMIT) num = MAX_CHAPTERS_LIMIT;
    if (num < chaptersMin) num = chaptersMin;
    setChaptersMax(num);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white text-gray-900 rounded-xl shadow-lg border border-gray-200 p-6 space-y-8">
      {loading && (
        <div className="text-sm text-gray-500">Đang tải bộ lọc...</div>
      )}

      {/* Chapters */}
      <section>
        <h2 className="font-semibold mb-3">Number of Chapters -</h2>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">min</span>
              <input
                type="number"
                className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                value={chaptersMin}
                onChange={(e) => handleMinChange(e.target.value)}
                onClick={() => setShouldSliderChangeMin(true)}
              />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">max</span>
              <input
                type="number"
                className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                value={chaptersMax}
                onChange={(e) => handleMaxChange(e.target.value)}
                onClick={() => setShouldSliderChangeMin(false)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min={MIN_CHAPTERS_LIMIT}
              max={MAX_CHAPTERS_LIMIT}
              value={shouldSliderChangeMin ? chaptersMin : chaptersMax}
              onChange={(e) =>
                shouldSliderChangeMin
                  ? handleMinChange(e.target.value)
                  : handleMaxChange(e.target.value)
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{MIN_CHAPTERS_LIMIT}</span>
              <span>{MAX_CHAPTERS_LIMIT}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="flex flex-wrap gap-8">
        <div className="space-y-3">
          <h2 className="font-semibold">State -</h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setState("all")}
              className={
                "px-4 py-2 rounded-md border text-sm transition " +
                (state === "all"
                  ? "bg-[#1e6091] text-white border-[#1e6091]"
                  : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50")
              }
            >
              All
            </button>

            {statusOptions.map((s) => {
              const active = state === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setState(s)}
                  className={
                    "px-4 py-2 rounded-md border text-sm transition " +
                    (active
                      ? "bg-[#1e6091] text-white border-[#1e6091]"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50")
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-3">
        <h2 className="font-semibold">Categories -</h2>

        <div className="flex flex-wrap gap-3 mb-2">
          {selectedCategories.slice(0, MAX_CATEGORIES).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => toggleCategory(name)}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#1e6091] text-white border-b-4 border-[#f6aa1c] shadow-sm"
            >
              {name}
            </button>
          ))}

          {selectedCategories.length === 0 && (
            <span className="text-xs text-gray-400">
              Chưa chọn category nào.
            </span>
          )}
        </div>

        <input
          type="text"
          placeholder="Search here"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
        />

        <div className="max-h-40 overflow-y-auto mt-2 border border-gray-200 rounded-md p-2">
          <div className="flex flex-wrap gap-2">
            {visibleGenres.map((name) => {
              const active = selectedCategories.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleCategory(name)}
                  className={
                    "px-4 py-1.5 rounded-md text-xs border transition " +
                    (active
                      ? "bg-[#1e6091] text-white border-[#1e6091]"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50")
                  }
                >
                  {name}
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
          onClick={onCancel}
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
