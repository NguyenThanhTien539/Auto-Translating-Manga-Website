"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, BookOpen } from "lucide-react";
import { ViewDetailButton } from "@/app/components/admin/Button";
import FilterBar from "@/app/components/admin/Filter";
import { toast } from "sonner";
import { formatDate } from "@/utils/format";
import Image from "next/image";

type MangaItem = {
  manga_id: number;
  title: string;
  author: string;
  cover_image: string;
  status: string; // "OnGoing" | "Completed" | "Dropped"
  uploader_name: string;
  created_at: string;
  is_approved?: boolean; // Giả sử có trường này hoặc dùng logic khác để check duyệt
};

export default function ManageMangaPage() {
  const router = useRouter();

  // ========= STATE =========
  const [mangaList, setMangaList] = useState<MangaItem[]>([]);

  // ========= FILTER STATE =========
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // ========= SELECTION =========
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Fetch Manga List
  const fetchMangas = () => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/manage-manga/list`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setMangaList(data.mangaList);
        } else {
          setMangaList([]);
          toast.error(data.message || "Lấy danh sách truyện thất bại");
        }
      })
      .catch(() => {
        toast.error("Không thể tải danh sách truyện");
      });
  };

  useEffect(() => {
    fetchMangas();
  }, []);

  // // ========= ACTIONS =========
  // const handleApprove = async (id: number) => {
  //   try {
  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/manga/approve/${id}`,
  //       {
  //         method: "PATCH",
  //         credentials: "include",
  //       }
  //     );
  //     const data = await res.json();
  //     if (data.code === "success") {
  //       toast.success("Đã duyệt truyện thành công");
  //       fetchMangas(); // Reload list
  //     } else {
  //       toast.error(data.message || "Lỗi khi duyệt truyện");
  //     }
  //   } catch (error) {
  //     toast.error("Lỗi kết nối server");
  //   }
  // };

  // const handleReject = async (id: number) => {
  //   // Có thể thêm modal nhập lý do từ chối ở đây
  //   if (!confirm("Bạn có chắc muốn từ chối/ẩn truyện này?")) return;

  //   try {
  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/manga/reject/${id}`,
  //       {
  //         method: "PATCH",
  //         credentials: "include",
  //       }
  //     );
  //     const data = await res.json();
  //     if (data.code === "success") {
  //       toast.success("Đã ẩn truyện thành công");
  //       fetchMangas();
  //     } else {
  //       toast.error(data.message || "Lỗi khi ẩn truyện");
  //     }
  //   } catch (error) {
  //     toast.error("Lỗi kết nối server");
  //   }
  // };

  // ========= HELPERS =========
  const resetFilters = () => {
    setStatusFilter("all");
    setSearch("");
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allChecked =
    mangaList.length > 0 &&
    mangaList.every((m) => selectedIds.includes(m.manga_id));

  const toggleAll = () => {
    const ids = mangaList.map((m) => m.manga_id);
    setSelectedIds((prev) => {
      if (allChecked) return prev.filter((id) => !ids.includes(id));
      const set = new Set([...prev, ...ids]);
      return Array.from(set);
    });
  };

  // ========= FILTERED LIST =========
  const filteredMangas = useMemo(() => {
    return mangaList.filter((manga) => {
      if (statusFilter !== "all" && manga.status !== statusFilter) return false;

      if (search.trim()) {
        const key = search.toLowerCase();
        if (
          !manga.title.toLowerCase().includes(key) &&
          !manga.author?.toLowerCase().includes(key)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [mangaList, statusFilter, search]);

  // ========= STATUS BADGE =========
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OnGoing: "bg-blue-100 text-blue-700 border-blue-200",
      Completed: "bg-green-100 text-green-700 border-green-200",
      Dropped: "bg-red-100 text-red-700 border-red-200",
      Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };

    const labels: Record<string, string> = {
      OnGoing: "Đang tiến hành",
      Completed: "Hoàn thành",
      Dropped: "Tạm ngưng",
      Pending: "Chờ duyệt",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          styles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="w-full min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-[1600px] mx-auto">
        <h2 className="font-semibold text-2xl sm:text-3xl mb-4 sm:mb-6">
          Quản lý truyện tranh
        </h2>

        <FilterBar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusOptions={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "Pending", label: "Chờ duyệt" },
            { value: "OnGoing", label: "Đang tiến hành" },
            { value: "Completed", label: "Hoàn thành" },
            { value: "Dropped", label: "Tạm ngưng" },
          ]}
          onResetFilters={resetFilters}
          bulkActionOptions={[
            { value: "delete", label: "Xóa đã chọn" },
            { value: "approve", label: "Duyệt đã chọn" },
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
                      className="w-4 h-4 cursor-pointer"
                      checked={allChecked}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Thông tin truyện
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Tác giả
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Người đăng
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
                {filteredMangas.map((manga) => {
                  const checked = selectedIds.includes(manga.manga_id);

                  return (
                    <tr
                      key={manga.manga_id}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(manga.manga_id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-16 relative rounded overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            {manga.cover_image ? (
                              <Image
                                src={manga.cover_image}
                                alt={manga.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <BookOpen size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div
                              className="font-medium text-gray-900 line-clamp-1"
                              title={manga.title}
                            >
                              {manga.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {manga.manga_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {manga.author || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          {manga.uploader_name || "Unknown"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(manga.status)}
                      </td>

                      <td className="px-6 py-4 text-center text-sm text-gray-500">
                        {formatDate(manga.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Nút xem chi tiết */}

                          <ViewDetailButton
                            href={`/admin/manage-manga/read/${manga.manga_id}`}
                            title="Xem chi tiết"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredMangas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">
                      Không có truyện nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
