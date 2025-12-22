/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Mail, Shield, Ban } from "lucide-react";
import FilterBar from "@/app/components/admin/Filter";
import { toast } from "sonner";
import { formatDate } from "@/utils/format";
import Image from "next/image";
import { EditButton } from "@/app/components/admin/Button";
type UserItem = {
  user_id: number;
  full_name: string;
  username: string;
  email: string;
  role_id: string;
  role_name: string;
  user_status: string; // "active" | "banned" hoặc 0/1
  created_at: string;
  avatar?: string;
};

export default function ManageUsersPage() {
  const router = useRouter();

  // ========= STATE =========
  const [userList, setUserList] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ========= FILTER STATE =========
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // ========= SELECTION =========
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/user/list`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setUserList(data.userList);
        } else {
          setUserList([]);
          toast.error(data.message || "Lấy danh sách người dùng thất bại");
        }
      })
      .catch(() => {
        toast.error("Không thể tải danh sách người dùng");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // ========= HELPERS =========
  const resetFilters = () => {
    setRoleFilter("all");
    setSearch("");
  };

  const normalizeStatus = (status: string | number): string => {
    if (status === "active" || status === "1" || status === 1) return "active";
    if (status === "banned" || status === "0" || status === 0) return "banned";
    return String(status).toLowerCase().trim();
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allChecked =
    userList.length > 0 &&
    userList.every((u) => selectedIds.includes(u.user_id));

  const toggleAll = () => {
    const ids = userList.map((u) => u.user_id);
    setSelectedIds((prev) => {
      if (allChecked) return prev.filter((id) => !ids.includes(id));
      const set = new Set([...prev, ...ids]);
      return Array.from(set);
    });
  };

  // ========= FILTERED LIST (nếu muốn lọc theo role + search) =========
  const filteredUsers = useMemo(() => {
    return userList.filter((user) => {
      if (roleFilter !== "all" && user.role_id !== roleFilter) return false;

      if (search.trim()) {
        const key = search.toLowerCase();
        if (
          !user.full_name.toLowerCase().includes(key) &&
          !user.email.toLowerCase().includes(key) &&
          !user.username.toLowerCase().includes(key)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [userList, roleFilter, search]);

  // ========= ROLE BADGE (TIẾNG VIỆT) =========
  const getRoleBadge = (roleName: string) => {
    const labels: Record<string, string> = {
      Uploader: "Người đăng",
      Reader: "Độc giả",
      uploader: "Người đăng",
      reader: "Độc giả",
    };

    const styles: Record<string, string> = {
      Uploader: "bg-purple-100 text-purple-700 border-purple-200",
      Reader: "bg-amber-100 text-amber-700 border-amber-200",
      uploader: "bg-purple-100 text-purple-700 border-purple-200",
      reader: "bg-amber-100 text-amber-700 border-amber-200",
    };

    const icons: Record<string, string> = {
      Uploader: "📤",
      Reader: "📖",
      uploader: "📤",
      reader: "📖",
    };

    const label = labels[roleName] || roleName;
    const style =
      styles[roleName] || "bg-gray-100 text-gray-700 border-gray-200";
    const icon = icons[roleName] || "👤";

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${style}`}
      >
        <span>{icon}</span>
        {label}
      </span>
    );
  };

  // ========= STATUS BADGE =========
  const getStatusBadge = (status: string | number) => {
    const normalizedStatus = normalizeStatus(status);

    const styles: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700 border-emerald-200",
      ban: "bg-red-100 text-red-600 border-red-200",
    };

    const labels: Record<string, string> = {
      active: "✓ Đang hoạt động",
      ban: "✗ Bị cấm",
    };

    const icons: Record<string, React.ReactNode> = {
      active: <Shield size={14} className="text-emerald-600" />,
      ban: <Ban size={14} className="text-red-600" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
          styles[normalizedStatus] ||
          "bg-gray-100 text-gray-700 border-gray-200"
        }`}
      >
        {icons[normalizedStatus]}
        {labels[normalizedStatus] || "Không xác định"}
      </span>
    );
  };

  return (
    <div className="w-full min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto">
          <h2 className="font-semibold text-2xl sm:text-3xl mb-4 sm:mb-6">
            Quản lý người dùng
          </h2>

          <FilterBar
            search={search}
            setSearch={setSearch}
            statusFilter={roleFilter}
            setStatusFilter={setRoleFilter}
            statusOptions={[
              { value: "all", label: "Tất cả vai trò" },
              { value: "2", label: "Độc giả" },
              { value: "1", label: "Người đăng" },
            ]}
            onResetFilters={resetFilters}
          />

          {/* Desktop Table */}
          <div className="mt-4 sm:mt-5 bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden hidden lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Họ và tên
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Vai trò
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Hành động
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    return (
                      <tr
                        key={user.user_id}
                        className="hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                              {user.avatar ? (
                                <Image
                                  src={user.avatar}
                                  alt={user.full_name}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 object-cover"
                                />
                              ) : (
                                <span className="text-lg font-bold text-gray-700">
                                  {user.full_name?.[0]?.toUpperCase() || "U"}
                                </span>
                              )}
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-gray-900">
                                {user.full_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-600 text-center">
                            {user.email}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          {getRoleBadge(user.role_name)}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(user.user_status)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-center font-medium text-gray-600 text-xs">
                            {formatDate(user.created_at)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <EditButton
                              href={`/admin/manage-users/edit/${user.user_id}`}
                              title="Chỉnh sửa"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-gray-500"
                      >
                        Không có người dùng nào
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
              const checked = selectedIds.includes(user.user_id);

              return (
                <div
                  key={user.user_id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(user.user_id)}
                          className="w-4 h-4 cursor-pointer flex-shrink-0"
                        />
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                          {user.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.full_name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover"
                            />
                          ) : (
                            <span className="text-xl font-bold text-gray-700">
                              {user.full_name?.[0]?.toUpperCase() || "U"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate text-base">
                            {user.full_name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getRoleBadge(user.role_name)}
                      {getStatusBadge(user.user_status)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 py-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <Mail
                        size={16}
                        className="text-blue-500 mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Email</p>
                        <p className="text-sm text-gray-700 break-all">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      Tạo: {formatDate(user.created_at)}
                    </div>
                  </div>

                  {/* Card Footer - Actions */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-2.5 bg-purple-500 hover:bg-purple-600 text:white rounded-lg text-sm font-medium flex items-center justify-center cursor-pointer gap-1.5 transition-colors shadow-sm"
                        onClick={() =>
                          router.push(
                            `/admin/manage-users/edit/${user.user_id}`
                          )
                        }
                        title="Chỉnh sửa"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="col-span-full bg-white rounded-xl border border-gray-200 py-10 text-center text-gray-500">
                Không có người dùng nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
