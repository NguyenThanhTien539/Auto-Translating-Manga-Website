"use client";

import { Filter, RotateCcw, Search } from "lucide-react";

type StatusType = "all" | "active" | "inactive";

type Props = {
  statusFilter: StatusType;
  setStatusFilter: (v: StatusType) => void;

  creatorFilter: string;
  setCreatorFilter: (v: string) => void;

  dateFrom: string;
  setDateFrom: (v: string) => void;

  dateTo: string;
  setDateTo: (v: string) => void;

  search: string;
  setSearch: (v: string) => void;

  creatorOptions: string[];

  selectedIds: number[];
  onResetFilters: () => void;
  onApplyBulkAction: () => void;
  onCreateNew: () => void;
};

export default function FilterBar({
  statusFilter,
  setStatusFilter,
  creatorFilter,
  setCreatorFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  search,
  setSearch,
  creatorOptions,
  selectedIds,
  onResetFilters,
  onApplyBulkAction,
  onCreateNew,
}: Props) {
  return (
    <div className="mb-7 space-y-10">
      {/* Hàng trên */}
      <div className="flex h-20 items-stretch rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm text-[15px] w-fit">
        {/* Bộ */}
        <div className="flex h-full items-center gap-2 px-5 border-r border-gray-200 font-medium text-gray-800">
          <Filter className="w-5 h-5" />
          <span>Bộ</span>
        </div>

        {/* Trạng thái */}
        <div className="flex h-full items-center gap-2 px-5 border-r border-gray-300">
          <select
            className="bg-transparent outline-none font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusType)}
          >
            <option value="all" className="text-sm">
              Trạng thái
            </option>
            <option value="active" className="text-sm">
              Hoạt động
            </option>
            <option value="inactive" className="text-sm">
              Dừng
            </option>
          </select>
        </div>

        {/* Người tạo */}
        <div className="flex items-center px-5 h-full border-r border-gray-300">
          <select
            className="bg-transparent outline-none font-medium"
            value={creatorFilter}
            onChange={(e) => setCreatorFilter(e.target.value)}
          >
            <option className="text-sm" value="">
              Người tạo
            </option>
            {creatorOptions.map((c) => (
              <option className="text-sm" key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Khoảng ngày */}
        <div className="flex h-full items-center gap-3 px-5 border-r border-gray-300">
          <input
            type="date"
            className="h-8 rounded-lg px-2"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span>-</span>
          <input
            type="date"
            className="h-8 rounded-lg px-2"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {/* Xóa bộ lọc */}
        <button
          type="button"
          onClick={onResetFilters}
          className="flex items-center gap-2 px-5 h-full text-sm font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Xóa bộ lọc</span>
        </button>
      </div>

      {/* Hàng dưới */}
      <div className="flex h-20 items-stretch items-center gap-3">
        {/* Hành động */}
        <div className="flex rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
          <select className="h-full px-4 text-sm text-gray-800 border-r border-gray-200 bg-white">
            <option>-- Hành động --</option>
            <option>Ẩn thể loại</option>
            <option>Xóa thể loại</option>
          </select>
          <button
            type="button"
            className="h-full px-5 text-sm font-semibold text-red-600 hover:bg-gray-50 cursor-pointer"
            onClick={onApplyBulkAction}
          >
            Áp dụng
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="flex items-center space-x-2 h-full w-[500px] rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
          <Search className="w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm"
            className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Nút tạo mới */}
        <button
          type="button"
          className="h-full px-6 rounded-2xl bg-blue-500 text-white text-[15px] font-semibold hover:bg-blue-600 cursor-pointer"
          onClick={onCreateNew}
        >
          + Tạo mới
        </button>
      </div>
    </div>
  );
}
