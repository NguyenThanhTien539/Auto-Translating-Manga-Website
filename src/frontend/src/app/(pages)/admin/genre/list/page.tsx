"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { EditButton } from "@/app/components/admin/Button";

type GenreItem = {
  genre_id: number;
  genre_name: string;
};

const headerRowClass =
  "grid bg-gray-50 text-sm font-semibold text-gray-700 border-b border-gray-200 justify-items-center";
const rowClass =
  "grid text-sm text-gray-700 bg-white border-b border-gray-100 justify-items-center";
const gridCols = "1.5fr 1.2fr";

export default function CategoryListPage() {
  const router = useRouter();
  const [items, setItems] = useState<GenreItem[]>([]);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/genre/list`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") setItems(data.list);
      });
  }, []);

  return (
    <>
      {/* Title + Create button */}
      <div className="flex items-center justify-between mb-10">
        <h2 className="font-[600] text-3xl text-center flex-1">
          Quản lý thể loại Manga
        </h2>

        <button
          onClick={() => router.push("/admin/genre/create")}
          className="ml-4 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={18} />
          Tạo thể loại mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[900px] mx-auto">
            {/* Header */}
            <div
              className={headerRowClass}
              style={{ gridTemplateColumns: gridCols }}
            >
              <div className="px-4 py-4 text-center">Tên thể loại</div>
              <div className="px-4 py-4 text-center whitespace-nowrap">
                Hành động
              </div>
            </div>

            {/* Body */}
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.genre_id}
                  className={`${rowClass} hover:bg-gray-50 transition-colors`}
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <div className="px-4 py-4 font-medium text-gray-900 text-center">
                    {item.genre_name}
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <EditButton
                      href={`/admin/genre/edit/${item.genre_id}`}
                      title="Chỉnh sửa"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
