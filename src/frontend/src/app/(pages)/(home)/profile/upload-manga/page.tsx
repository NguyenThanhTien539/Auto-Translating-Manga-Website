/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Book, 
  AlertCircle, 
  CheckCircle2,
  Loader2
} from "lucide-react";
import Image from "next/image";

export default function UploadMangaPage() {
  const { infoUser, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"new-manga" | "new-chapter">("new-manga");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    genres: "", // Có thể nâng cấp thành Multi-select sau
    mangaId: "", // Dùng cho tab đăng chương mới
    chapterNumber: "",
    chapterTitle: "",
    language: "original"
  });

  const [myMangas, setMyMangas] = useState<{id: string, title: string}[]>([]);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null); // File ZIP
  const [previewCover, setPreviewCover] = useState<string | null>(null);

  // 1. Security Check: Chỉ cho phép Uploader truy cập
  useEffect(() => {
    if (!isLoading) {
      if (!infoUser) {
        router.push("/account/login");
      } else if (infoUser.role !== "Uploader") {
        toast.error("Bạn không có quyền truy cập trang này!");
        router.push("/");
      }
    }
  }, [infoUser, isLoading, router]);

  // Fetch mangas when switching to "new-chapter" tab
  useEffect(() => {
    if (activeTab === "new-chapter" && infoUser) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/my-mangas`, {
        credentials: "include"
      })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setMyMangas(data.data);
        }
      })
      .catch(err => console.error(err));
    }
  }, [activeTab, infoUser]);

  // Xử lý chọn ảnh bìa
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setPreviewCover(URL.createObjectURL(file));
    }
  };

  // Xử lý chọn file ZIP nội dung
  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra đuôi file cơ bản
      if (!file.name.endsWith('.zip') && !file.name.endsWith('.rar')) {
        toast.error("Vui lòng chỉ upload file .zip hoặc .rar");
        return;
      }
      setContentFile(file);
    }
  };

  // Xử lý Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = new FormData();
      
      // Append dữ liệu chung
      data.append("type", activeTab); // Để backend biết đang xử lý loại nào
      data.append("file_content", contentFile as Blob);
      data.append("language", formData.language);

      if (activeTab === "new-manga") {
        if (!coverFile) throw new Error("Thiếu ảnh bìa truyện");
        data.append("title", formData.title);
        data.append("author", formData.author);
        data.append("description", formData.description);
        data.append("genres", formData.genres);
        data.append("cover_image", coverFile);
      } else {
        if (!formData.mangaId) throw new Error("Chưa chọn truyện");
        data.append("manga_id", formData.mangaId);
        data.append("chapter_number", formData.chapterNumber);
        data.append("chapter_title", formData.chapterTitle);
      }

      // Gọi API (Cần implement backend tương ứng)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/upload`, {
        method: "POST",
        body: data,
        credentials: "include", // Quan trọng: Gửi cookie xác thực
        // Lưu ý: Không set Content-Type header khi dùng FormData, browser tự làm
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Upload thành công!");
        router.push("/profile/manage"); // Chuyển hướng về trang quản lý chung
      } else {
        toast.error(result.message || "Có lỗi xảy ra khi upload");
      }

    } catch (error: any) {
      toast.error(error.message || "Lỗi kết nối server");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || infoUser?.role !== "Uploader") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload size={24} />
            Upload Truyện & Chương Mới
          </h1>
          <p className="text-blue-100 mt-1 text-sm">
            Đăng tải truyện mới hoặc cập nhật chương mới cho truyện đã có. Hỗ trợ file .zip
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("new-manga")}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === "new-manga"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Đăng Truyện Mới
          </button>
          <button
            onClick={() => setActiveTab("new-chapter")}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === "new-chapter"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Thêm Chương Mới
          </button>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* === FORM ĐĂNG TRUYỆN MỚI === */}
            {activeTab === "new-manga" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Cột trái: Ảnh bìa */}
                <div className="col-span-1 space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Ảnh bìa truyện</label>
                  <div className="relative w-full aspect-[2/3] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden hover:bg-gray-50 transition-colors group">
                    {previewCover ? (
                      <Image 
                        src={previewCover} 
                        alt="Preview" 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="mx-auto h-10 w-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <p className="mt-2 text-xs text-gray-500">Click để tải ảnh lên</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                </div>

                {/* Cột phải: Thông tin */}
                <div className="col-span-1 md:col-span-2 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên truyện</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Ví dụ: One Piece"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.author}
                        onChange={(e) => setFormData({...formData, author: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Hành động, Phiêu lưu..."
                        value={formData.genres}
                        onChange={(e) => setFormData({...formData, genres: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Tóm tắt nội dung truyện..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ gốc</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                    >
                      <option value="original">Gốc (Original)</option>
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">Tiếng Anh</option>
                      <option value="jp">Tiếng Nhật</option>
                      <option value="cn">Tiếng Trung</option>
                      <option value="kr">Tiếng Hàn</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* === FORM ĐĂNG CHƯƠNG MỚI === */}
            {activeTab === "new-chapter" && (
              <div className="space-y-5 max-w-2xl mx-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chọn truyện</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.mangaId}
                    onChange={(e) => setFormData({...formData, mangaId: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn truyện cần đăng --</option>
                    {myMangas.map(manga => (
                      <option key={manga.id} value={manga.id}>{manga.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số chương</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="VD: 100"
                      value={formData.chapterNumber}
                      onChange={(e) => setFormData({...formData, chapterNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương (Tùy chọn)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="VD: Trận chiến cuối cùng"
                      value={formData.chapterTitle}
                      onChange={(e) => setFormData({...formData, chapterTitle: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                  >
                    <option value="original">Gốc (Original)</option>
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">Tiếng Anh</option>
                    <option value="jp">Tiếng Nhật</option>
                    <option value="cn">Tiếng Trung</option>
                    <option value="kr">Tiếng Hàn</option>
                  </select>
                </div>
              </div>
            )}

            {/* === PHẦN UPLOAD FILE ZIP (CHUNG CHO CẢ 2 TAB) === */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File nội dung truyện (.zip, .rar)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
                <input
                  type="file"
                  accept=".zip,.rar"
                  onChange={handleContentChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                {contentFile ? (
                  <div className="flex flex-col items-center text-green-600">
                    <CheckCircle2 size={40} className="mb-2" />
                    <span className="font-medium">{contentFile.name}</span>
                    <span className="text-sm text-gray-500">{(contentFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <FileText size={40} className="mb-2 text-gray-400" />
                    <span className="font-medium text-gray-700">Kéo thả file vào đây hoặc click để chọn</span>
                    <span className="text-xs mt-1">Hỗ trợ file nén chứa ảnh các trang truyện</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-start gap-2 mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p>Lưu ý: File zip nên chứa các ảnh được đánh số thứ tự (01.jpg, 02.jpg...) để đảm bảo thứ tự trang đúng.</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                  ${isSubmitting 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : activeTab === "new-manga" 
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-blue-500/30"
                      : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:shadow-purple-500/30"
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    {activeTab === "new-manga" ? "Đăng Truyện Ngay" : "Đăng Chương Mới"}
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
