"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye, 
  X 
} from "lucide-react";

// 1. Type Definitions khớp với DB
interface Author {
  author_id: number;
  author_name: string;
  biography: string;
  avatar_url: string;
}

// 2. Mock Data (Giả lập dữ liệu ban đầu)
const INITIAL_AUTHORS: Author[] = [
  {
    author_id: 1,
    author_name: "Kentaro Miura",
    biography: "Kentaro Miura was a Japanese manga artist. He was best known for his acclaimed dark fantasy manga series Berserk...",
    avatar_url: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=1000",
  },
  {
    author_id: 2,
    author_name: "Eiichiro Oda",
    biography: "Eiichiro Oda is a Japanese manga artist and the creator of the series One Piece.",
    avatar_url: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1000",
  },
  // Thêm dữ liệu mẫu khác...
];

export default function AuthorManagement() {
  // State
  const [authors, setAuthors] = useState<Author[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAuthors, setSelectedAuthors] = useState<number[]>([]);
  
  // State cho Modal (Thêm/Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Author>>({
    author_name: "",
    biography: "",
    avatar_url: "",
  });

  // --- Handlers ---

  // Lọc tác giả theo Search
  const filteredAuthors = authors.filter((author) =>
    author.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Xử lý Checkbox chọn nhiều
  const toggleSelect = (id: number) => {
    if (selectedAuthors.includes(id)) {
      setSelectedAuthors(selectedAuthors.filter((i) => i !== id));
    } else {
      setSelectedAuthors([...selectedAuthors, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedAuthors.length === filteredAuthors.length) {
      setSelectedAuthors([]);
    } else {
      setSelectedAuthors(filteredAuthors.map((a) => a.author_id));
    }
  };

  // Mở Modal (Mode Thêm mới hoặc Sửa)
  const openModal = (author?: Author) => {
    if (author) {
      setEditingAuthor(author);
      setFormData(author);
    } else {
      setEditingAuthor(null);
      setFormData({ author_name: "", biography: "", avatar_url: "" });
    }
    setIsModalOpen(true);
  };

  // Ví dụ hàm load dữ liệu
  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/authors/all`,
      { credentials: "include" }
    )
      .then(res => res.json())
      .then(data => { setAuthors(data); console.log(data); });
  }, []);

  // Ví dụ hàm xóa
  const handleDelete = async (id: number) => {
    if (confirm("Xóa tác giả này?")) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/authors/${id}`, { method: 'DELETE' });
      // Load lại danh sách
    }
  };

  // Xử lý Lưu (Giả lập gọi API)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAuthor) {
      // Logic Update
      setAuthors(authors.map(a => a.author_id === editingAuthor.author_id ? { ...a, ...formData } as Author : a));
    } else {
      // Logic Create
      const newId = Math.max(...authors.map(a => a.author_id)) + 1;
      setAuthors([{ ...formData, author_id: newId } as Author, ...authors]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý tác giả</h1>
        <p className="text-sm text-gray-500 mt-1">Danh sách và thông tin chi tiết các tác giả</p>
      </div>

      {/* Toolbar & Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Left: Filter & Search */}
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" />
            Bộ lọc
          </button>
          
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm tác giả..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right: Add Button */}
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors shadow-sm text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Thêm tác giả
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Bulk Actions (Optional - shown when items selected) */}
        {selectedAuthors.length > 0 && (
          <div className="bg-sky-50 px-6 py-2 border-b border-sky-100 flex items-center justify-between text-sm text-sky-700">
            <span>Đã chọn {selectedAuthors.length} tác giả</span>
            <button className="text-red-600 font-medium hover:underline">Xóa các mục đã chọn</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    onChange={toggleSelectAll}
                    checked={filteredAuthors.length > 0 && selectedAuthors.length === filteredAuthors.length}
                  />
                </th>
                <th className="px-6 py-4">Thông tin tác giả</th>
                <th className="px-6 py-4">Tiểu sử (Biography)</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAuthors.map((author) => (
                <tr key={author.author_id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      checked={selectedAuthors.includes(author.author_id)}
                      onChange={() => toggleSelect(author.author_id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0">
                        <Image
                          src={author.avatar_url || "/placeholder-avatar.png"}
                          alt={author.author_name}
                          fill
                          className="object-cover rounded-full border border-gray-200"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{author.author_name}</div>
                        <div className="text-xs text-gray-500">ID: {author.author_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-500 line-clamp-2 max-w-md" title={author.biography}>
                      {author.biography || "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openModal(author)}
                        className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors" 
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(author.author_id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors" title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredAuthors.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">
                    Không tìm thấy tác giả nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <div>Hiển thị {filteredAuthors.length} kết quả</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Trước</button>
            <button className="px-3 py-1 border border-gray-300 bg-sky-50 text-sky-600 border-sky-200 rounded font-medium">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Sau</button>
          </div>
        </div>
      </div>

      {/* --- MODAL ADD/EDIT --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800 text-lg">
                {editingAuthor ? "Cập nhật thông tin tác giả" : "Thêm tác giả mới"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên tác giả <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Nhập tên tác giả..."
                    value={formData.author_name}
                    onChange={(e) => setFormData({...formData, author_name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="https://..."
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                  />
                  {/* Preview ảnh nhỏ nếu có URL */}
                  {formData.avatar_url && (
                    <div className="mt-2 h-16 w-16 relative rounded-full overflow-hidden border border-gray-200">
                         <img src={formData.avatar_url} alt="Preview" className="object-cover h-full w-full" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiểu sử</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Mô tả về tác giả..."
                    value={formData.biography}
                    onChange={(e) => setFormData({...formData, biography: e.target.value})}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 shadow-sm"
                >
                  {editingAuthor ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}