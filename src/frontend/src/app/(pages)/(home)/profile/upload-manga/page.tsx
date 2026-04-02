/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/utils/make_slug";
import { toast } from "sonner";
import { Upload, FileText, Book, AlertCircle, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import JustValidate from "just-validate";
import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import { getSocketClient } from "@/socket/socket.client";
import {
  ChapterSocketPayload,
  MangaSocketPayload,
} from "@/socket/socket.types";
registerPlugin(FilePondPluginFileValidateType, FilePondPluginImagePreview);

const TinyMCEEditor = dynamic(() => import("@/app/components/TinyMCEEditor"), {
  ssr: false,
});

export default function UploadMangaPage() {
  const editorRef = useRef<any>(null);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"new-manga" | "new-chapter">(
    "new-manga",
  );

  const [languages, setLanguages] = useState<Array<any>>([]);
  const [genres, setGenres] = useState<Array<any>>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  const [coverFile, setCoverFile] = useState<any[]>([]);
  const [contentFile, setContentFile] = useState<any[]>([]);
  const [contentFileChapter, setContentFileChapter] = useState<any[]>([]);

  const [selectedMangaForChapter, setSelectedMangaForChapter] = useState("");

  const [errors, setErrors] = useState<{
    coverFile: string;
    contentFile: string;
    contentFileChapter: string;
    description: string;
    genres: string;
  }>({
    coverFile: "",
    contentFile: "",
    contentFileChapter: "",
    description: "",
    genres: "",
  });

  const [myMangas, setMyMangas] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isUploadingManga, setIsUploadingManga] = useState(false);
  const [isUploadingChapter, setIsUploadingChapter] = useState(false);
  const [liveChapterProgress, setLiveChapterProgress] = useState<
    Record<
      number,
      {
        mangaId: number;
        progress: number;
        status: string;
        message: string;
        error?: string;
      }
    >
  >({});

  const [liveMangaStatus, setLiveMangaStatus] = useState<
    Record<
      number,
      {
        status: string;
        message: string;
        error?: string;
      }
    >
  >({});

  const readApiResponse = async (res: Response): Promise<any> => {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return res.json();
    }

    const rawText = await res.text();
    const text = rawText
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      code: "error",
      message: text
        ? `Server trả về phản hồi không hợp lệ: ${text.slice(0, 180)}`
        : `Server trả về phản hồi không hợp lệ (HTTP ${res.status})`,
    };
  };

  // Clear errors when files are selected
  useEffect(() => {
    if (coverFile.length > 0 && errors.coverFile) {
      setErrors((prev) => ({ ...prev, coverFile: "" }));
    }
  }, [coverFile, errors.coverFile]);

  // FIX: clear đúng field contentFileChapter
  useEffect(() => {
    if (contentFileChapter.length > 0 && errors.contentFileChapter) {
      setErrors((prev) => ({ ...prev, contentFileChapter: "" }));
    }
  }, [contentFileChapter, errors.contentFileChapter]);

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
    const fetchLanguages = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/mangas/languages`,
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.code === "success") setLanguages(data.data);
      } catch (error) {
        console.error("Error fetching languages:", error);
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/genres`,
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.success) setGenres(data.data);
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };
    fetchGenres();
  }, []);

  const handleSubmitMangaForm = (event: any) => {
    event.preventDefault();
    setIsUploadingManga(true);

    setErrors({
      coverFile: "",
      contentFile: "",
      contentFileChapter: "",
      description: "",
      genres: "",
    });

    let hasError = false;
    const newErrors = {
      coverFile: "",
      contentFile: "",
      contentFileChapter: "",
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
      setIsUploadingManga(false);
      return;
    }

    const form = event.target as HTMLFormElement;
    const formData = new FormData();
    formData.append("title", form.mangaTitle.value);
    formData.append("author_name", form.mangaAuthor.value);
    formData.append("language", form.mangaLanguage.value);
    formData.append("description", mangaDescription);
    formData.append("cover_image", coverFile[0].file);
    formData.append("chapter_zip", contentFile[0].file);
    formData.append("slug", slugify(form.mangaTitle.value));
    formData.append("genres", JSON.stringify(selectedGenres));

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/mangas/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then(async (res) => {
        const data = await readApiResponse(res);
        if (!res.ok) {
          return {
            code: "error",
            message: data?.message || `Upload thất bại (HTTP ${res.status})`,
          };
        }
        return data;
      })
      .then((data) => {
        if (data.code === "success") {
          toast.success(data.message);
          if (data?.data?.mangaId) {
            const mangaId = Number(data.data.mangaId);
            setLiveMangaStatus((prev) => ({
              ...prev,
              [mangaId]: {
                status: "processing",
                message: "Đã gửi lên server, đang chờ worker xử lý",
              },
            }));
          }
          form.reset();
          setCoverFile([]);
          setContentFile([]);
          setSelectedGenres([]);
          editorRef.current?.setContent("");
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        console.error("Error uploading manga:", error);
        toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
      })
      .finally(() => {
        setIsUploadingManga(false);
      });
  };

  const handleSubmitChapterForm = (event: any) => {
    event.preventDefault();

    setErrors({
      coverFile: "",
      contentFile: "",
      contentFileChapter: "",
      description: "",
      genres: "",
    });

    let hasError = false;
    const newErrors = {
      coverFile: "",
      contentFile: "",
      contentFileChapter: "",
      description: "",
      genres: "",
    };

    // Dùng state (đảm bảo đúng)
    if (!selectedMangaForChapter) {
      newErrors.genres = "Vui lòng chọn truyện";
      hasError = true;
    }

    // Check file thật sự (filepond item có thể tồn tại nhưng chưa có file)
    const hasChapterZip = Boolean(contentFileChapter?.[0]?.file);
    if (!hasChapterZip) {
      newErrors.contentFileChapter = "Vui lòng chọn file nội dung chương";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      document.getElementById("chapterContentFile")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    // CHỈ set uploading sau khi validate pass
    setIsUploadingChapter(true);

    const formData = new FormData();
    formData.append("manga_id", selectedMangaForChapter);
    formData.append("chapter_zip", contentFileChapter[0].file);

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/mangas/upload-chapter`, {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then(async (res) => {
        const data = await readApiResponse(res);
        if (!res.ok) {
          return {
            code: "error",
            message: data?.message || `Upload thất bại (HTTP ${res.status})`,
          };
        }
        return data;
      })
      .then((data) => {
        if (data.code === "success") {
          toast.success(data.message);
          if (data?.data?.chapterId && data?.data?.mangaId) {
            const chapterId = Number(data.data.chapterId);
            const mangaId = Number(data.data.mangaId);
            setLiveChapterProgress((prev) => ({
              ...prev,
              [chapterId]: {
                mangaId,
                progress: 0,
                status: "processing",
                message: "Đã gửi lên server, đang chờ worker xử lý",
              },
            }));
          }
          setContentFileChapter([]);
        } else {
          toast.error(
            data.message ||
              "Đã có lỗi xảy ra khi đăng chương. Vui lòng thử lại.",
          );
        }
      })
      .catch((error) => {
        console.error("Error uploading chapter:", error);
        toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
      })
      .finally(() => {
        setIsUploadingChapter(false);
      });
  };

  const fetchMyMangas = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/mangas/my-mangas`,
        { method: "GET", credentials: "include" },
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.code === "success") setMyMangas(data.data);
    } catch (error) {
      console.error("Error fetching my mangas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyMangas();
  }, [fetchMyMangas]);

  useEffect(() => {
    const socket = getSocketClient();

    const upsertChapterPayload = (payload: ChapterSocketPayload) => {
      setLiveChapterProgress((prev) => ({
        ...prev,
        [payload.chapterId]: {
          mangaId: payload.mangaId,
          progress: payload.progress ?? prev[payload.chapterId]?.progress ?? 0,
          status: payload.status,
          message: payload.message,
          error: payload.error,
        },
      }));
    };

    const upsertMangaPayload = (payload: MangaSocketPayload) => {
      setLiveMangaStatus((prev) => ({
        ...prev,
        [payload.mangaId]: {
          status: payload.status,
          message: payload.message,
          error: payload.error,
        },
      }));
    };

    const handleChapterProcessing = (payload: ChapterSocketPayload) => {
      upsertChapterPayload({ ...payload, progress: 0 });
      toast.info(`Chương #${payload.chapterId} đang được xử lý`);
    };

    const handleChapterProgress = (payload: ChapterSocketPayload) => {
      upsertChapterPayload(payload);
    };

    const handleChapterPending = (payload: ChapterSocketPayload) => {
      upsertChapterPayload({ ...payload, progress: 100 });
      toast.success(`Chương #${payload.chapterId} đã xử lý xong, chờ duyệt`);
      fetchMyMangas();
    };

    const handleChapterFailed = (payload: ChapterSocketPayload) => {
      upsertChapterPayload(payload);
      toast.error(
        payload.error
          ? `Chương #${payload.chapterId} lỗi: ${payload.error}`
          : `Chương #${payload.chapterId} xử lý thất bại`,
      );
      fetchMyMangas();
    };

    const handleChapterPublished = (payload: ChapterSocketPayload) => {
      toast.success(`Chương #${payload.chapterId} đã được xuất bản`);
      fetchMyMangas();
    };

    const handleChapterRejected = (payload: ChapterSocketPayload) => {
      toast.error(
        payload.review_note
          ? `Chương #${payload.chapterId} bị từ chối: ${payload.review_note}`
          : `Chương #${payload.chapterId} bị từ chối`,
      );
      fetchMyMangas();
    };

    const handleMangaProcessing = (payload: MangaSocketPayload) => {
      upsertMangaPayload(payload);
      toast.info(`Truyện #${payload.mangaId} đang được xử lý`);
    };

    const handleMangaPending = (payload: MangaSocketPayload) => {
      upsertMangaPayload(payload);
      toast.success(`Truyện #${payload.mangaId} đã xử lý xong, chờ duyệt`);
      fetchMyMangas();
    };

    const handleMangaFailed = (payload: MangaSocketPayload) => {
      upsertMangaPayload(payload);
      toast.error(
        payload.error
          ? `Truyện #${payload.mangaId} lỗi: ${payload.error}`
          : `Truyện #${payload.mangaId} xử lý thất bại`,
      );
      fetchMyMangas();
    };

    const handleMangaPublished = (payload: MangaSocketPayload) => {
      toast.success(`Truyện #${payload.mangaId} đã được xuất bản`);
      fetchMyMangas();
    };

    const handleMangaRejected = (payload: MangaSocketPayload) => {
      toast.error(
        payload.review_note
          ? `Truyện #${payload.mangaId} bị từ chối: ${payload.review_note}`
          : `Truyện #${payload.mangaId} bị từ chối`,
      );
      fetchMyMangas();
    };

    socket.on("chapter:processing", handleChapterProcessing);
    socket.on("chapter:progress", handleChapterProgress);
    socket.on("chapter:pending_review", handleChapterPending);
    socket.on("chapter:failed", handleChapterFailed);
    socket.on("chapter:published", handleChapterPublished);
    socket.on("chapter:rejected", handleChapterRejected);

    socket.on("manga:processing", handleMangaProcessing);
    socket.on("manga:pending_review", handleMangaPending);
    socket.on("manga:failed", handleMangaFailed);
    socket.on("manga:published", handleMangaPublished);
    socket.on("manga:rejected", handleMangaRejected);

    return () => {
      socket.off("chapter:processing", handleChapterProcessing);
      socket.off("chapter:progress", handleChapterProgress);
      socket.off("chapter:pending_review", handleChapterPending);
      socket.off("chapter:failed", handleChapterFailed);
      socket.off("chapter:published", handleChapterPublished);
      socket.off("chapter:rejected", handleChapterRejected);

      socket.off("manga:processing", handleMangaProcessing);
      socket.off("manga:pending_review", handleMangaPending);
      socket.off("manga:failed", handleMangaFailed);
      socket.off("manga:published", handleMangaPublished);
      socket.off("manga:rejected", handleMangaRejected);
    };
  }, [fetchMyMangas]);

  useEffect(() => {
    if (activeTab !== "new-manga" || isLoading) return;

    const validateMangaForm = new JustValidate("#mangaForm", {
      errorFieldCssClass: "is-invalid",
      errorLabelCssClass: "text-red-500 text-sm mt-1",
    });

    validateMangaForm
      .addField("#mangaTitle", [
        { rule: "required", errorMessage: "Vui lòng nhập tên truyện" },
      ])
      .addField("#mangaAuthor", [
        { rule: "required", errorMessage: "Vui lòng nhập tên tác giả" },
      ])
      .addField("#mangaLanguage", [
        { rule: "required", errorMessage: "Vui lòng chọn ngôn ngữ" },
      ])
      .onSuccess((event: any) => {
        handleSubmitMangaForm(event);
      });

    return () => {
      validateMangaForm.destroy();
    };
  }, [activeTab, isLoading]);

  // Reset errors + reset form chapter state khi đổi tab (để nút disable đúng)
  useEffect(() => {
    setErrors({
      coverFile: "",
      contentFile: "",
      contentFileChapter: "",
      description: "",
      genres: "",
    });

    if (activeTab === "new-chapter") {
      // vào tab chapter: reset chọn truyện + file chương
      setSelectedMangaForChapter("");
      setContentFileChapter([]);
      setIsUploadingChapter(false);
    }
  }, [activeTab]);

  // ✅ điều kiện disable nút chương
  const chapterDisabled = isUploadingChapter || !contentFileChapter?.[0]?.file;

  // ✅ điều kiện disable nút manga
  const mangaDisabled = isUploadingManga || !contentFile?.[0]?.file;

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {(Object.keys(liveMangaStatus).length > 0 ||
              Object.keys(liveChapterProgress).length > 0) && (
              <div className="mb-4 bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-800 mb-2">
                  Cập nhật realtime
                </h2>

                {Object.entries(liveMangaStatus).map(([mangaId, data]) => (
                  <div
                    key={`manga-${mangaId}`}
                    className="text-sm text-gray-700 mb-1"
                  >
                    Truyện #{mangaId}: {data.message}
                    {data.error ? ` (${data.error})` : ""}
                  </div>
                ))}

                {Object.entries(liveChapterProgress).map(
                  ([chapterId, data]) => (
                    <div
                      key={`chapter-${chapterId}`}
                      className="text-sm text-gray-700 mb-1"
                    >
                      Chương #{chapterId}: {data.message} - {data.progress}%
                      {data.error ? ` (${data.error})` : ""}
                    </div>
                  ),
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
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
                      Đăng tải truyện mới hoặc cập nhật chương mới cho truyện đã
                      có
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
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
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
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
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
                    {/* Ảnh bìa */}
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

                    {/* Thông tin */}
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
                                checked={selectedGenres.includes(
                                  genre.genre_id,
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGenres((prev) => [
                                      ...prev,
                                      genre.genre_id,
                                    ]);
                                    if (errors.genres) {
                                      setErrors((prev) => ({
                                        ...prev,
                                        genres: "",
                                      }));
                                    }
                                  } else {
                                    setSelectedGenres((prev) =>
                                      prev.filter(
                                        (id) => id !== genre.genre_id,
                                      ),
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
                          ZIP phải theo folder chapter (ví dụ:
                          Chapter_001/001.jpg, Chapter_002/001.jpg)
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
                    disabled={mangaDisabled}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold text-white shadow-md transition-all ${
                      mangaDisabled
                        ? "opacity-50 cursor-not-allowed pointer-events-none bg-gray-400"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    }`}
                  >
                    {isUploadingManga ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Upload size={20} />
                    )}
                    <span>
                      {isUploadingManga ? "Đang đăng..." : "Đăng Truyện Ngay"}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              // FORM ĐĂNG CHƯƠNG MỚI
              <form
                id="chapterForm"
                onSubmit={handleSubmitChapterForm}
                className="space-y-6"
              >
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
                        value={selectedMangaForChapter}
                        onChange={(e) => {
                          setSelectedMangaForChapter(e.target.value);
                          if (e.target.value && errors.genres) {
                            setErrors((prev) => ({ ...prev, genres: "" }));
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white cursor-pointer"
                      >
                        <option value="">-- Chọn truyện cần đăng --</option>
                        {myMangas.map((manga) => (
                          <option key={manga.manga_id} value={manga.manga_id}>
                            {manga.title}
                          </option>
                        ))}
                      </select>

                      {errors.genres && (
                        <p className="text-red-500 text-sm mt-2">
                          {errors.genres}
                        </p>
                      )}
                    </div>
                  </div>
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
                      ]}
                      onupdatefiles={setContentFileChapter}
                      files={contentFileChapter}
                    />
                  </div>

                  {errors.contentFileChapter && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.contentFileChapter}
                    </p>
                  )}

                  <div className="flex items-start gap-2 mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Lưu ý:</p>
                      <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                        <li>
                          Mỗi file ZIP chỉ nên chứa ảnh của 1 chapter
                          (01.jpg, 02.jpg...)
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
                    disabled={chapterDisabled}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold text-white shadow-md transition-all ${
                      chapterDisabled
                        ? "opacity-50 cursor-not-allowed pointer-events-none bg-gray-400"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    }`}
                  >
                    {isUploadingChapter ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Upload size={20} />
                    )}
                    <span>
                      {isUploadingChapter ? "Đang đăng..." : "Đăng Chương Mới"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
