"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import CategoryFilterBar from "@/app/components/admin/Filter";

type CategoryItem = {
  id: number;
  name: string;
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

  // ========= DỮ LIỆU GIẢ =========
  const [items] = useState<CategoryItem[]>([
    {
      id: 1,
      name: "Thức ăn cho chó",
      status: "active",
      created_by: "thanhtien",
      updated_by: "thanhtien",
      created_at: "2025-11-25T08:30:00Z",
      updated_at: "2025-11-26T10:15:00Z",
    },
    {
      id: 2,
      name: "Thức ăn cho mèo",
      status: "active",
      created_by: "Le Van A",
      updated_by: "Staff A",
      created_at: "2025-11-20T09:00:00Z",
      updated_at: "2025-11-24T14:45:00Z",
    },
    {
      id: 3,
      name: "Phụ kiện thú cưng",
      status: "inactive",
      created_by: "Le Van B",
      updated_by: "Le Van B",
      created_at: "2025-11-10T07:20:00Z",
      updated_at: "2025-11-18T16:10:00Z",
    },
    {
      id: 4,
      name: "Dịch vụ khám bệnh",
      status: "active",
      created_by: "thanhtienne",
      updated_by: "Bác sĩ An",
      created_at: "2025-11-01T06:00:00Z",
      updated_at: "2025-11-22T11:30:00Z",
    },
    {
      id: 5,
      name: "Vaccine & tiêm phòng",
      status: "active",
      created_by: "Le Van A",
      updated_by: "Le Van A",
      created_at: "2025-10-28T13:40:00Z",
      updated_at: "2025-11-21T09:05:00Z",
    },
  ]);

  // ========= FILTER STATE =========
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [creatorFilter, setCreatorFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // danh sách người tạo (loại trùng, bỏ null)
  const creatorOptions: string[] = Array.from(
    new Set(
      items
        .map((i) => i.created_by)
        .filter((v): v is string => !!v && v.trim() !== "")
    )
  );

  // Áp dụng lọc
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
      if (!item.name.toLowerCase().includes(key)) return false;
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

  // ========= CHECKBOX SELECTION =========
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const allChecked =
    filteredItems.length > 0 &&
    filteredItems.every((i) => selectedIds.includes(i.id));

  const toggleAll = () => {
    const filteredIds = filteredItems.map((i) => i.id);
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

  return (
    <>
      <h2 className="font-[600] text-3xl mb-10">Quản lý thể loại Manga</h2>

      {/* FILTER BAR TÁCH RIÊNG */}
      <CategoryFilterBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        creatorFilter={creatorFilter}
        setCreatorFilter={setCreatorFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        search={search}
        setSearch={setSearch}
        creatorOptions={creatorOptions}
        selectedIds={selectedIds}
        onResetFilters={resetFilters}
        onApplyBulkAction={() => console.log("Áp dụng cho:", selectedIds)}
        onCreateNew={() => router.push("/admin/category/create")}
      />

      {/* ===== TABLE GRID ===== */}
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
                const checked = selectedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`${rowClass} hover:bg-gray-50 transition-colors`}
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    <div className="px-4 py-4 flex items-center justify-start">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(item.id)}
                        className="w-4 h-4"
                      />
                    </div>

                    <div className="px-4 py-4 font-medium text-gray-900 text-center">
                      {item.name}
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
                            router.push(`/admin/category/edit/${item.id}`)
                          }
                        >
                          <Pencil size={18} />
                        </button>
                        <button className="px-3 py-2 hover:bg-red-50 text-red-500">
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
