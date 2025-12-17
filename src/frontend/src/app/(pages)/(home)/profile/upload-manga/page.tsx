/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import JustValidate from "just-validate";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
registerPlugin(FilePondPluginFileValidateType, FilePondPluginImagePreview);

const TinyMCEEditor = dynamic(() => import("@/app/components/TinyMCEEditor"), {
  ssr: false,
});

export default function UploadMangaPage() {
  const editorRef = useRef<any>(null);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"new-manga" | "new-chapter">(
    "new-manga"
  );
  const [languages, setLanguages] = useState<Array<any>>([]);
  const [genres, setGenres] = useState<Array<any>>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [coverFile, setCoverFile] = useState<any[]>([]);
  const [contentFile, setContentFile] = useState<any[]>([]);
  const [contentFileChapter, setContentFileChapter] = useState<any[]>([]);
  const [errors, setErrors] = useState({
    coverFile: "",
    contentFile: "",
    description: "",
    genres: "",
  });

  // Clear errors when files are selected
  useEffect(() => {
    if (coverFile.length > 0 && errors.coverFile) {
      setErrors((prev) => ({ ...prev, coverFile: "" }));
    }
  }, [coverFile]);

  useEffect(() => {
    if (contentFile.length > 0 && errors.contentFile) {
      setErrors((prev) => ({ ...prev, contentFile: "" }));
    }
  }, [contentFile]);

  // Clear description error when user types in TinyMCE
  useEffect(() => {
    if (!editorRef.current) return;

    const checkContent = () => {
      const content = editorRef.current?.getContent() || "";
      if (content.trim() && errors.description) {
        setErrors((prev) => ({ ...prev, description: "" }));
      }
    };

    const interval = setInterval(checkContent, 500);
    return () => clearInterval(interval);
  }, [errors.description]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/languages`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setLanguages(data.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching languages:", error);
      });
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/genres`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setGenres(data.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching languages:", error);
      });
  }, []);

  // fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/my-mangas`
  const handleSubmitMangaForm = (event: any) => {
    event.preventDefault();

    // Reset errors
    setErrors({
      coverFile: "",
      contentFile: "",
      description: "",
      genres: "",
    });

    let hasError = false;
    const newErrors = {
      coverFile: "",
      contentFile: "",
      description: "",
      genres: "",
    };

    const mangaDescription = editorRef.current?.getContent() || "";

    if (!mangaDescription.trim()) {
      newErrors.description = "Vui lòng nhập mô tả truyện";
      hasError = true;
    }

    if (coverFile.length === 0) {
      newErrors.coverFile = "Vui lòng chọn ảnh bìa truyện";
      hasError = true;
    }

    if (contentFile.length === 0) {
      newErrors.contentFile = "Vui lòng chọn file nội dung truyện";
      hasError = true;
    }

    if (selectedGenres.length === 0) {
      newErrors.genres = "Vui lòng chọn ít nhất một thể loại";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const form = event.target as HTMLFormElement;
    const formData = new FormData();
    formData.append("title", form.mangaTitle.value);
    formData.append("author", form.mangaAuthor.value);
    formData.append("language", form.mangaLanguage.value);
    formData.append("description", mangaDescription);
    formData.append("cover_image", coverFile[0].file);
    formData.append("file_content", contentFile[0].file);

    // Append multiple genres as JSON string or comma-separated
    formData.append("genres", JSON.stringify(selectedGenres));
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/manga/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          toast.success("Đăng truyện thành công!");
        } else {
          toast.error(
            data.message ||
              "Đã có lỗi xảy ra khi đăng truyện. Vui lòng thử lại."
          );
        }
      });
  };
  useEffect(() => {
    if (activeTab !== "new-manga") return;

    const validateMangaForm = new JustValidate("#mangaForm", {
      errorFieldCssClass: "is-invalid",
      errorLabelCssClass: "text-red-500 text-sm mt-1",
    });

    validateMangaForm
      .addField("#mangaTitle", [
        {
          rule: "required",
          errorMessage: "Vui lòng nhập tên truyện",
        },
      ])
      .addField("#mangaAuthor", [
        {
          rule: "required",
          errorMessage: "Vui lòng nhập tên tác giả",
        },
      ])
      .addField("#mangaLanguage", [
        {
          rule: "required",
          errorMessage: "Vui lòng chọn ngôn ngữ",
        },
      ])
      .onSuccess((event: any) => {
        handleSubmitMangaForm(event);
      });

    return () => {
      validateMangaForm.destroy();
    };
  }, [activeTab]);

  // Setup validation cho form chapter
  useEffect(() => {}, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 ">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 text-white">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Upload size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Upload Truyện & Chương Mới
                </h1>
                <p className="text-indigo-100 text-sm mt-1">
                  Đăng tải truyện mới hoặc cập nhật chương mới cho truyện đã có
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-50">
            <button
              onClick={() => setActiveTab("new-manga")}
              className={`flex-1 py-4 text-sm font-semibold text-center transition-all relative ${
                activeTab === "new-manga"
                  ? "text-indigo-600 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Book size={18} />
                <span>Đăng Truyện Mới</span>
              </div>
              {activeTab === "new-manga" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("new-chapter")}
              className={`flex-1 py-4 text-sm font-semibold text-center transition-all relative ${
                activeTab === "new-chapter"
                  ? "text-purple-600 bg-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText size={18} />
                <span>Thêm Chương Mới</span>
              </div>
              {activeTab === "new-chapter" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Form Content */}
        {activeTab === "new-manga" ? (
          // FORM ĐĂNG TRUYỆN MỚI
          <form
            id="mangaForm"
            onSubmit={handleSubmitMangaForm}
            className="space-y-6"
          >
            {/* Card thông tin cơ bản */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                <Book size={20} className="text-indigo-600" />
                Thông tin truyện
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Ảnh bìa - chiếm 1 cột */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ảnh bìa truyện <span className="text-red-500">*</span>
                  </label>

                  <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden">
                    <FilePond
                      className="pond-cover"
                      name="coverImage"
                      id="coverImage"
                      allowMultiple={false}
                      allowRemove={true}
                      acceptedFileTypes={["image/*"]}
                      files={coverFile}
                      onupdatefiles={setCoverFile}
                      labelIdle='Kéo thả ảnh vào đây hoặc <span class="filepond--label-action">Chọn file</span>'
                      imagePreviewHeight={320}
                    />
                  </div>
                  {errors.coverFile && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.coverFile}
                    </p>
                  )}
                </div>

                {/* Thông tin - chiếm 3 cột */}
                <div className="lg:col-span-3 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên truyện <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="mangaTitle"
                      name="mangaTitle"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Ví dụ: One Piece"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tác giả <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="mangaAuthor"
                        name="mangaAuthor"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="Tên tác giả"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngôn ngữ gốc <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="mangaLanguage"
                        name="mangaLanguage"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white cursor-pointer"
                      >
                        <option value="">-- Chọn ngôn ngữ --</option>
                        {languages.map((lang) => (
                          <option
                            key={lang.language_code}
                            value={lang.language_code}
                          >
                            {lang.language_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thể loại <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-300">
                      {genres.map((genre) => (
                        <label
                          key={genre.genre_id}
                          className={`inline-flex items-center px-4 py-2 rounded-full cursor-pointer transition-all ${
                            selectedGenres.includes(genre.genre_id)
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-gray-700 border border-gray-300 hover:border-indigo-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={selectedGenres.includes(genre.genre_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGenres([
                                  ...selectedGenres,
                                  genre.genre_id,
                                ]);
                                if (errors.genres) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    genres: "",
                                  }));
                                }
                              } else {
                                setSelectedGenres(
                                  selectedGenres.filter(
                                    (id) => id !== genre.genre_id
                                  )
                                );
                              }
                            }}
                          />
                          <span className="text-sm font-medium">
                            {genre.genre_name}
                          </span>
                        </label>
                      ))}
                    </div>
                    {errors.genres && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.genres}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card mô tả */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                Mô tả truyện
              </h2>
              <div id="description">
                <TinyMCEEditor value="" editorRef={editorRef} />
              </div>
              {errors.description && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Card upload file */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Upload size={20} className="text-indigo-600" />
                File nội dung truyện <span className="text-red-500">*</span>
              </h2>

              <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300">
                <FilePond
                  name="mangaContentFile"
                  id="mangaContentFile"
                  allowMultiple={false}
                  allowRemove={true}
                  labelIdle='Kéo thả file ZIP vào đây hoặc <span class="filepond--label-action">Chọn file</span>'
                  acceptedFileTypes={[
                    "application/zip",
                    "application/x-zip-compressed",
                    "application/x-rar-compressed",
                  ]}
                  onupdatefiles={setContentFile}
                  files={contentFile}
                />
              </div>
              {errors.contentFile && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.contentFile}
                </p>
              )}

              <div className="flex items-start gap-2 mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Lưu ý:</p>
                  <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                    <li>
                      File nên chứa ảnh đánh số thứ tự (01.jpg, 02.jpg...)
                    </li>
                    <li>Định dạng: JPG, PNG, WEBP</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 bg-white rounded-xl shadow-md p-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold text-white shadow-md transition-all bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Upload size={20} />
                <span>Đăng Truyện Ngay</span>
              </button>
            </div>
          </form>
        ) : (
          // FORM ĐĂNG CHƯƠNG MỚI
          <form id="chapterForm" className="space-y-6">
            {/* Card thông tin chương */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                <Book size={20} className="text-purple-600" />
                Thông tin chương
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn truyện <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="chapterMangaId"
                    name="manga_id"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn truyện cần đăng --</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số chương <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="chapterNumber"
                      name="chapter_number"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      placeholder="VD: 100"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên chương (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      id="chapterTitle"
                      name="chapter_title"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      placeholder="VD: Trận chiến cuối cùng"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngôn ngữ <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="chapterLanguage"
                    name="language"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn ngôn ngữ --</option>
                    <option value="original">🌐 Gốc (Original)</option>
                    <option value="vi">🇻🇳 Tiếng Việt</option>
                    <option value="en">🇬🇧 Tiếng Anh</option>
                    <option value="jp">🇯🇵 Tiếng Nhật</option>
                    <option value="cn">🇨🇳 Tiếng Trung</option>
                    <option value="kr">🇰🇷 Tiếng Hàn</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card mô tả */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-purple-600" />
                Mô tả chương
              </h2>
              <TinyMCEEditor value="" editorRef={editorRef} />
            </div>

            {/* Card upload file */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Upload size={20} className="text-purple-600" />
                File nội dung chương <span className="text-red-500">*</span>
              </h2>

              <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300">
                <FilePond
                  name="content_file"
                  id="chapterContentFile"
                  allowMultiple={false}
                  allowRemove={true}
                  labelIdle='Kéo thả file ZIP vào đây hoặc <span class="filepond--label-action">Chọn file</span>'
                  acceptedFileTypes={[
                    "application/zip",
                    "application/x-zip-compressed",
                    "application/x-rar-compressed",
                  ]}
                  onupdatefiles={setContentFileChapter}
                  files={contentFileChapter}
                />
              </div>

              <div className="flex items-start gap-2 mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Lưu ý:</p>
                  <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                    <li>
                      File nên chứa ảnh đánh số thứ tự (01.jpg, 02.jpg...)
                    </li>
                    <li>Định dạng: JPG, PNG, WEBP</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 bg-white rounded-xl shadow-md p-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold text-white shadow-md transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Upload size={20} />
                <span>Đăng Chương Mới</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
