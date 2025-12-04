/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, Check, X, Calendar } from "lucide-react";
import FilterBar from "@/app/components/admin/Filter";

type UserItem = {
  id: number;
  full_name: string;
  email: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

export default function UserListPage() {
  const router = useRouter();

  const [users] = useState<UserItem[]>([
    {
      id: 1,
      full_name: "Nguyễn Văn An",
      email: "nguyenvanan@gmail.com",
      status: "pending",
      created_at: "2024-12-04T10:30:00",
    },
    {
      id: 2,
      full_name: "Trần Thị Bích Ngọc",
      email: "bichngoc.tran@outlook.com",
      status: "accepted",
      created_at: "2024-12-03T14:20:00",
    },
    {
      id: 3,
      full_name: "Lê Minh Tuấn",
      email: "minhtuan.le99@yahoo.com",
      status: "rejected",
      created_at: "2024-12-02T09:15:00",
    },
    {
      id: 4,
      full_name: "Phạm Thu Hà",
      email: "thuha.pham@gmail.com",
      status: "pending",
      created_at: "2024-12-01T16:45:00",
    },
    {
      id: 5,
      full_name: "Hoàng Đức Minh",
      email: "ducminh.hoang@proton.me",
      status: "accepted",
      created_at: "2024-11-30T11:00:00",
    },
  ]);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "accepted" | "rejected"
  >("all");
  const [search, setSearch] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const resetFilters = () => {
    setStatusFilter("all");
    setSearch("");
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Filter by status
      if (statusFilter !== "all" && u.status !== statusFilter) return false;

      // Filter by search
      if (search.trim()) {
        const key = search.toLowerCase();
        if (
          !u.full_name.toLowerCase().includes(key) &&
          !u.email.toLowerCase().includes(key)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [users, statusFilter, search]);

  const toggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allChecked =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedIds.includes(u.id));

  const toggleAll = () => {
    const filteredIds = filteredUsers.map((u) => u.id);
    setSelectedIds((prev) => {
      if (allChecked) return prev.filter((id) => !filteredIds.includes(id));
      const newSet = new Set([...prev, ...filteredIds]);
      return Array.from(newSet);
    });
  };

  const getStatusBadge = (status: UserItem["status"]) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
      rejected: "bg-red-100 text-red-600 border-red-200",
    };

    const labels = {
      pending: "⏳ Chờ duyệt",
      accepted: "✓ Đã chấp nhận",
      rejected: "✗ Đã từ chối",
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="w-full min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-[1600px] mx-auto">
        <h2 className="font-semibold text-2xl sm:text-3xl mb-4 sm:mb-6">
          Quản lý đơn đăng ký
        </h2>

        <FilterBar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={(value: string) =>
            setStatusFilter(
              value as "all" | "pending" | "accepted" | "rejected"
            )
          }
          statusOptions={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "pending", label: "Chờ duyệt" },
            { value: "accepted", label: "Đã chấp nhận" },
            { value: "rejected", label: "Đã từ chối" },
          ]}
          onResetFilters={resetFilters}
          bulkActionOptions={[
            { value: "accept", label: "Chấp nhận đã chọn" },
            { value: "reject", label: "Từ chối đã chọn" },
          ]}
          onApplyBulkAction={(action) => {
            console.log("Áp dụng hành động:", action, "cho:", selectedIds);
          }}
        />

        {/* Desktop Table */}
        <div className="mt-4 sm:mt-5 bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-4 text-left w-12">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Họ và tên
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Ngày gửi
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const checked = selectedIds.includes(user.id);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(user.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Họ và tên */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center  gap-2">
                          <div className="font-medium text-gray-600">
                            {user.full_name}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-600 text-center ">
                          {user.email}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(user.status)}
                      </td>

                      {/* Ngày gửi */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 font-medium text-gray-600">
                          <Calendar
                            size={14}
                            className="font-medium text-gray-700 flex-shrink-0"
                          />
                          <span className="whitespace-nowrap">
                            {formatDate(user.created_at)}
                          </span>
                        </div>
                      </td>

                      {/* Hành động */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                            onClick={() =>
                              router.push(
                                `/admin/registration/detail/${user.id}`
                              )
                            }
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>
                          {user.status === "pending" && (
                            <>
                              <button
                                className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                                title="Chấp nhận"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-red-200 cursor-pointer"
                                title="Từ chối"
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      Không có đơn đăng ký nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="mt-4 sm:mt-5 grid grid-cols-1 gap-3 sm:gap-4 lg:hidden">
          {filteredUsers.map((user) => {
            const checked = selectedIds.includes(user.id);
            return (
              <div
                key={user.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(user.id)}
                        className="w-4 h-4 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-base">
                          {user.full_name}
                        </h3>
                        <p className="text-xs text-gray-500">#{user.id}</p>
                      </div>
                    </div>
                    {getStatusBadge(user.status)}
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 py-3 space-y-3">
                  <div className="text-sm text-gray-700">
                    <span className="text-gray-500 text-xs block mb-1">
                      Email
                    </span>
                    <span className="break-all">{user.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
                    <Calendar
                      size={14}
                      className="text-gray-400 flex-shrink-0"
                    />
                    <span className="text-xs">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/registration/detail/${user.id}`)
                      }
                    >
                      <Eye size={16} /> Xem chi tiết
                    </button>
                    {user.status === "pending" && (
                      <>
                        <button className="px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center justify-center cursor-pointer gap-1.5 transition-colors shadow-sm">
                          <Check size={16} />
                        </button>
                        <button className=" cursor-pointer px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-gray-200 py-10 text-center text-gray-500">
              Không có đơn đăng ký nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
