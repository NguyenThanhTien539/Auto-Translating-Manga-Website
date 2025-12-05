"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import FilterBar from "@/app/components/admin/Filter";

type GenreItem = {
  genre_id: number;
  genre_name: string;
  status: "active" | "inactive";
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
};

const headerRowClass =
  "grid bg-gray-50 text-sm font-semibold text-gray-700 border-b border-gray-200";
const rowClass = "grid text-sm text-gray-700 bg-white border-b border-gray-100";
const gridCols = "60px 1.5fr 1fr 1.2fr 1.2fr 1.2fr";

const formatDate = (d: string) =>
  new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function CategoryListPage() {
  const router = useRouter();

  // ========= STATE =========
  const [items, setItems] = useState<GenreItem[]>([]);

  // ========= FILTER STATE =========
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [creatorFilter, setCreatorFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // ========= SELECTION =========
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

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

  // danh sách người tạo (loại trùng, bỏ null)
  const creatorOptions: string[] = Array.from(
    new Set(
      items
        .map((i) => i.created_by)
        .filter((v) => v != null)
        .map(String)
        .filter((v) => v.trim() !== "")
    )
  );

  // ========= FILTER =========
  const filteredItems = items.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (creatorFilter && item.created_by !== creatorFilter) return false;

    if (dateFrom) {
      const from = new Date(dateFrom);
      if (new Date(item.created_at) < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (new Date(item.created_at) > to) return false;
    }

    if (search.trim()) {
      const key = search.toLowerCase();
      if (!item.genre_name.toLowerCase().includes(key)) return false;
    }

    return true;
  });

  const resetFilters = () => {
    setStatusFilter("all");
    setCreatorFilter("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  // ========= CHECKBOX =========
  const allChecked =
    filteredItems.length > 0 &&
    filteredItems.every((i) => selectedIds.includes(i.genre_id));

  const toggleAll = () => {
    const filteredIds = filteredItems.map((i) => i.genre_id);
    setSelectedIds((prev) => {
      if (allChecked) return prev.filter((id) => !filteredIds.includes(id));
      const newSet = new Set([...prev, ...filteredIds]);
      return Array.from(newSet);
    });
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // handler để truyền cho FilterBar (vì FilterBar dùng string)
  const handleStatusFilterChange = (v: string) => {
    setStatusFilter(v as "all" | "active" | "inactive");
  };

  return (
    <>
      <h2 className="font-[600] text-3xl mb-10">Quản lý thể loại Manga</h2>

      <FilterBar
        // cấu hình trạng thái linh hoạt
        statusFilter={statusFilter}
        setStatusFilter={handleStatusFilterChange}
        statusOptions={[
          { value: "all", label: "Trạng thái" },
          { value: "active", label: "Hoạt động" },
          { value: "inactive", label: "Dừng" },
        ]}
        // các filter khác
        creatorFilter={creatorFilter}
        setCreatorFilter={setCreatorFilter}
        creatorOptions={creatorOptions}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        search={search}
        setSearch={setSearch}
        // actions
        onResetFilters={resetFilters}
        onApplyBulkAction={() => console.log("Áp dụng cho:", selectedIds)}
        onCreateNew={() => router.push("/admin/category/create")}
      />

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header */}
            <div
              className={headerRowClass}
              style={{ gridTemplateColumns: gridCols }}
            >
              <div className="px-4 py-4 flex items-center justify-start">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="w-4 h-4"
                />
              </div>

              <div className="px-4 py-4 text-center">Tên thể loại</div>
              <div className="px-4 py-4 text-center whitespace-nowrap">
                Trạng thái
              </div>
              <div className="px-4 py-4 text-center whitespace-nowrap">
                Tạo bởi
              </div>
              <div className="px-4 py-4 text-center whitespace-nowrap">
                Cập nhật bởi
              </div>
              <div className="px-4 py-4 text-center whitespace-nowrap">
                Hành động
              </div>
            </div>

            {/* Body */}
            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => {
                const checked = selectedIds.includes(item.genre_id);

                return (
                  <div
                    key={item.genre_id}
                    className={`${rowClass} hover:bg-gray-50 transition-colors`}
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    <div className="px-4 py-4 flex items-center justify-start">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(item.genre_id)}
                        className="w-4 h-4"
                      />
                    </div>

                    <div className="px-4 py-4 font-medium text-gray-900 text-center">
                      {item.genre_name}
                    </div>

                    <div className="px-4 py-4 flex items-center justify-center">
                      <span
                        className={[
                          "inline-flex items-center justify-center px-3 py-1 rounded-md font-semibold",
                          "min-w-[110px] text-center",
                          item.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-200 text-red-600",
                        ].join(" ")}
                      >
                        {item.status === "active" ? "Hoạt động" : "Dừng"}
                      </span>
                    </div>

                    <div className="px-4 py-4 text-center">
                      <div className="font-medium">
                        {item.created_by || "Không rõ"}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {formatDate(item.created_at)}
                      </div>
                    </div>

                    <div className="px-4 py-4 text-center">
                      <div className="font-medium">
                        {item.updated_by || "Không rõ"}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {formatDate(item.updated_at)}
                      </div>
                    </div>

                    <div className="px-4 py-4 flex items-center justify-center">
                      <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() =>
                            router.push(`/admin/category/edit/${item.genre_id}`)
                          }
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          className="px-3 py-2 hover:bg-red-50 text-red-500"
                          onClick={async () => {
                            if (
                              confirm(
                                `Bạn có chắc muốn xóa thể loại "${item.genre_name}"?`
                              )
                            ) {
                              await fetch(
                                `/api/admin/categories/${item.genre_id}`,
                                {
                                  method: "DELETE",
                                }
                              );
                            }
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="py-10 text-center text-gray-500">
                  Không có danh mục nào phù hợp bộ lọc
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
