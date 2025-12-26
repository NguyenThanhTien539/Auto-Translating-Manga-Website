/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect, use } from "react";
import Image from "next/image";
import { Pencil, User, X } from "lucide-react";
import FilterBar from "@/app/components/admin/Filter";

import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import { toast } from "sonner";

// Register the plugins
registerPlugin(FilePondPluginFileValidateType, FilePondPluginImagePreview);

// 1. Type Definitions khớp với DB
interface Author {
  author_id: number;
  author_name: string;
  biography: string;
  avatar_url: string;
  status?: "active" | "inactive";
}

export default function AuthorManagement() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [avatar, setAvatar] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState<Partial<Author>>({
    author_id: undefined,
    author_name: "",
    biography: "",
    avatar_url: "",
  });

  const filteredAuthors = useMemo(() => {
    return (authors ?? []).filter((author) => {
      if (search.trim()) {
        const key = search.toLowerCase();
        if (
          !author.author_name.toLowerCase().includes(key) &&
          !author.biography.toLowerCase().includes(key)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [authors, search]);

  // Helper function để render avatar
  const renderAvatar = (author: Author) => {
    if (author.avatar_url) {
      return (
        <Image
          src={author.avatar_url}
          alt={author.author_name}
          width={48}
          height={48}
          className="w-12 h-12 object-cover"
        />
      );
    } else {
      return (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-gray-700">
            {author.author_name?.[0]?.toUpperCase() || "U"}
          </span>
        </div>
      );
    }
  };

  // Handle avatar file change
  const handleAvatarChange = (fileItems: any[]) => {
    setAvatar(fileItems);
    if (fileItems.length > 0) {
      const file = fileItems[0].file;
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, avatar_url: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({ ...formData, avatar_url: "" });
    }
  };

  // Mở Modal (Mode Thêm mới hoặc Sửa)
  const openModal = (author?: Author) => {
    if (author) {
      setEditingAuthor(author);
      setFormData({
        author_name: author.author_name || "",
        biography: author.biography || "",
        avatar_url: author.avatar_url || "",
      });
      setAvatar([]); // Reset avatar files
    } else {
      setEditingAuthor(null);
      setFormData({ author_name: "", biography: "", avatar_url: "" });
      setAvatar([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1) Xác định ID cho API
      // - Update: lấy từ editingAuthor
      // - Create: tạo newId tạm (chỉ cho UI). Nếu backend có POST create thì nên dùng POST thay vì PATCH update.
      let idForApi: number;

      if (editingAuthor) {
        idForApi = editingAuthor.author_id;
      } else {
        const newId =
          authors.length > 0
            ? Math.max(...authors.map((a) => a.author_id)) + 1
            : 1;
        idForApi = newId;
      }

      // 2) Optimistic UI update
      if (editingAuthor) {
        setAuthors((prev) =>
          prev.map((a) =>
            a.author_id === editingAuthor.author_id
              ? ({ ...a, ...formData, author_id: idForApi } as Author)
              : a
          )
        );
      } else {
        setAuthors((prev) => [
          {
            ...(formData as Author),
            author_id: idForApi,
            status: "active",
          },
          ...prev,
        ]);
      }

      // 3) Tạo FormData để gửi file + text
      const fd = new FormData();
      fd.append("author_id", String(idForApi));
      fd.append("author_name", formData.author_name || "");
      fd.append("biography", formData.biography || "");

      // Gửi file thật (để req.file có giá trị)
      if (avatar?.length > 0 && avatar[0]?.file) {
        fd.append("avatar_url", avatar[0].file); // key "avatar" phải khớp upload.single("avatar")
      }

      // 4) Call API
      const url = `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/manage-authors/update/${idForApi}`;

      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));

      if (data.code == "success") {
        toast.success(data.message);
      } else {
        toast.error("Lưu tác giả thất bại");
      }

      // 5) Đóng modal + reset
      setIsModalOpen(false);
      setEditingAuthor(null);
      setAvatar([]);
      setFormData({
        author_id: undefined,
        author_name: "",
        biography: "",
        avatar_url: "",
      });
    } catch (err) {
      console.error("Error saving author:", err);
    }
  };

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/manage-authors/all`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setAuthors(data.authors);
        } else {
          setAuthors([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch authors:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="w-full min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto">
          <h2 className="font-semibold text-2xl sm:text-3xl mb-4 sm:mb-6">
            Quản lý tác giả
          </h2>

          {/* Desktop Table */}
          <div className="mt-4 sm:mt-5 bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden hidden lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-1/3">
                      Tác giả
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-1/3">
                      Tiểu sử
                    </th>

                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 w-1/3">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAuthors.map((author) => {
                    return (
                      <tr
                        key={author.author_id}
                        className="hover:bg-blue-50/50 transition-colors"
                      >
                        {/* Tác giả */}
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center justify-center gap-3">
                            {renderAvatar(author)}
                            <div className="text-center">
                              <div className="font-medium text-gray-900">
                                {author.author_name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tiểu sử */}
                        <td className="px-6 py-4 align-middle">
                          <div className="text-sm text-gray-600 text-center max-w-xs mx-auto line-clamp-2">
                            {author.biography || "Chưa có tiểu sử"}
                          </div>
                        </td>

                        {/* Ngày tạo */}

                        {/* Hành động */}
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openModal(author)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAuthors.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-gray-500"
                      >
                        Không có tác giả nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile/Tablet Cards */}
          <div className="mt-4 sm:mt-5 grid grid-cols-1 gap-3 sm:gap-4 lg:hidden">
            {filteredAuthors.map((author) => {
              return (
                <div
                  key={author.author_id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate text-base">
                            {author.author_name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            ID: #{author.author_id}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 py-3 space-y-3">
                    {/* Avatar */}
                    <div className="flex items-center gap-3">
                      {renderAvatar(author)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">Tiểu sử</p>
                        <p className="text-sm text-gray-700 line-clamp-2 text-center">
                          {author.biography || "Chưa có tiểu sử"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer - Actions */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                        onClick={() => openModal(author)}
                      >
                        <Pencil size={16} /> Chỉnh sửa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAuthors.length === 0 && (
              <div className="col-span-full bg-white rounded-xl border border-gray-200 py-10 text-center text-gray-500">
                Không có tác giả nào
              </div>
            )}
          </div>

          {/* --- MODAL ADD/EDIT --- */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50">
                  <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                    {editingAuthor ? (
                      <Pencil className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    {editingAuthor
                      ? "Cập nhật thông tin tác giả"
                      : "Thêm tác giả mới"}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSave}>
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên tác giả <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 transition-all"
                        placeholder="Nhập tên tác giả..."
                        value={formData.author_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            author_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Avatar
                      </label>
                      <FilePond
                        name="avatar"
                        allowMultiple={false}
                        allowRemove={true}
                        labelIdle='Kéo thả ảnh vào đây hoặc <span class="filepond--label-action">Chọn file</span>'
                        acceptedFileTypes={["image/*"]}
                        onupdatefiles={handleAvatarChange}
                        files={avatar}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiểu sử
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 transition-all resize-none"
                        placeholder="Mô tả về tác giả..."
                        value={formData.biography}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            biography: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                    >
                      {editingAuthor ? "Cập nhật" : "Tạo mới"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
