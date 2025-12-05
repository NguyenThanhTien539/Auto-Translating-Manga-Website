/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, Check, X, Calendar, Mail } from "lucide-react";
import FilterBar from "@/app/components/admin/Filter";
import { formatDate } from "@/utils/format";
import { ViewDetailButton } from "@/app/components/admin/Button";
interface RequestItem {
  request_id: number;
  full_name: string;
  email: string;
  request_status: "pending" | "accepted" | "rejected";
  request_created_at: string;
}

export default function UserListPage() {
  const router = useRouter();

  const [requestList, setRequestList] = useState<RequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "accepted" | "rejected"
  >("all");
  const [search, setSearch] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const resetFilters = () => {
    setStatusFilter("all");
    setSearch("");
  };

  const filteredRequests = useMemo(() => {
    return requestList.filter((req) => {
      // Filter by status
      if (statusFilter !== "all" && req.request_status !== statusFilter)
        return false;

      // Filter by search
      if (search.trim()) {
        const key = search.toLowerCase();
        if (
          !req.full_name.toLowerCase().includes(key) &&
          !req.email.toLowerCase().includes(key)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [requestList, statusFilter, search]);

  const toggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allChecked =
    filteredRequests.length > 0 &&
    filteredRequests.every((req) => selectedIds.includes(req.request_id));

  const toggleAll = () => {
    const filteredIds = filteredRequests.map((req) => req.request_id);
    setSelectedIds((prev) => {
      if (allChecked) return prev.filter((id) => !filteredIds.includes(id));
      const newSet = new Set([...prev, ...filteredIds]);
      return Array.from(newSet);
    });
  };

  const getStatusBadge = (status: RequestItem["request_status"]) => {
    const styles: Record<RequestItem["request_status"], string> = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
      rejected: "bg-red-100 text-red-600 border-red-200",
    };

    const labels: Record<RequestItem["request_status"], string> = {
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

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/registration-uploader/list`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success" && Array.isArray(data.list)) {
          setRequestList(data.list);
        } else {
          setRequestList([]);
        }
      });
  }, []);

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
                {filteredRequests.map((request) => {
                  const checked = selectedIds.includes(request.request_id);
                  const isPending = request.request_status === "pending";

                  return (
                    <tr
                      key={request.request_id}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(request.request_id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Họ và tên */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="font-medium text-gray-600">
                            {request.full_name}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-600 text-center">
                          {request.email}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(request.request_status)}
                      </td>

                      {/* Ngày gửi */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 font-medium text-gray-600">
                          <Calendar
                            size={14}
                            className="font-medium text-gray-700 flex-shrink-0"
                          />
                          <span className="whitespace-nowrap">
                            {formatDate(request.request_created_at)}
                          </span>
                        </div>
                      </td>

                      {/* Hành động */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <ViewDetailButton
                            href={`/admin/registration/detail/${request.request_id}`}
                            title="Xem chi tiết"
                          />
                          {isPending && (
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

                {filteredRequests.length === 0 && (
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
          {filteredRequests.map((request) => {
            const checked = selectedIds.includes(request.request_id);
            const isPending = request.request_status === "pending";

            return (
              <div
                key={request.request_id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(request.request_id)}
                        className="w-4 h-4 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-base">
                          {request.full_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          ID: #{request.request_id}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(request.request_status)}
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 py-3 space-y-3">
                  {/* Email */}
                  <div className="flex items-start gap-2">
                    <Mail
                      size={16}
                      className="text-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Email</p>
                      <p className="text-sm text-gray-700 break-all">
                        {request.email}
                      </p>
                    </div>
                  </div>

                  {/* Ngày gửi */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
                    <Calendar
                      size={14}
                      className="text-gray-400 flex-shrink-0"
                    />
                    <span className="text-xs">
                      {formatDate(request.request_created_at)}
                    </span>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/admin/registration/detail/${request.request_id}`
                        )
                      }
                    >
                      <Eye size={16} /> Xem chi tiết
                    </button>
                    {isPending && (
                      <>
                        <button
                          className="px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center justify-center cursor-pointer gap-1.5 transition-colors shadow-sm"
                          title="Chấp nhận"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="cursor-pointer px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          title="Từ chối"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRequests.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-gray-200 py-10 text-center text-gray-500">
              Không có đơn đăng ký nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
