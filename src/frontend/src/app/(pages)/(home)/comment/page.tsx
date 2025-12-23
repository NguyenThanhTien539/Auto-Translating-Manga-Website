"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, Send, ArrowLeft, MessageCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useAuth } from "@/app/hooks/useAuth";

interface Comment {
  comment_id: string;
  user_name: string;
  content: string;
  rating: number;
  avatar?: string;
  created_at: string;
}

interface Chapter {
  chapter_id: string;
  chapter_number: string;
  title: string;
  views?: number;
}

type Manga = {
  manga_id: string;
  title: string;
  author_name: string;
  cover_image: string;
  description: string;
  genres: string[];
  status: string;
  totalChapters?: number;
  rating?: number;
};

function CommentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const manga_id = searchParams.get("manga_id");
  const chapter_id = searchParams.get("chapter_id");
  const { infoUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [mangaDetail, setMangaDetail] = useState<Manga | null>(null);

  const [chapterDetail, setChapterDetail] = useState<Chapter | null>(null);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/manga/detail?manga_id=${manga_id}&chapter_id=${chapter_id}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.code === "success") {
          if (data.data.chapter) {
            setChapterDetail(data.data.chapter);
          }
          if (data.data.manga) {
            setMangaDetail(data.data.manga);
          }
        } else {
          setMangaDetail(null);
          setChapterDetail(null);
        }
      });
  }, [manga_id, chapter_id]);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/comments/list?chapter_id=${chapter_id}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.code === "success") {
          setComments(data.data);
        } else {
          setComments([]);
        }
      })
      .catch(() => {
        setComments([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [manga_id, chapter_id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || newRating === 0) {
      toast.error("Vui lòng nhập nội dung và chọn đánh giá!");
      return;
    }

    setIsSubmitting(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/comments/add?chapter_id=${chapter_id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: newComment,
          rating: newRating,
        }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.code === "success") {
          toast.success(data.message);

          // Thêm comment mới vào danh sách ngay lập tức
          const newCommentData: Comment = {
            comment_id: Date.now().toString(),
            user_name: infoUser.username,
            content: newComment,
            avatar: infoUser.avatar,
            rating: newRating,
            created_at: new Date().toISOString(),
          };

          setComments([newCommentData, ...comments]);
          setNewComment("");
          setNewRating(0);
          setIsSubmitting(false);
        } else {
          toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
          setIsSubmitting(false);
        }
      })
      .catch((error) => {
        console.error("Error submitting comment:", error);
        toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
        setIsSubmitting(false);
      });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={interactive ? 24 : 16}
            className={`cursor-${
              interactive ? "pointer" : "default"
            } transition-colors ${
              star <= (interactive ? hoverRating || newRating : rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-slate-600"
            }`}
            onClick={() => interactive && setNewRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          />
        ))}
      </div>
    );
  };

  if (!manga_id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Không tìm thấy thông tin manga</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 shadow-lg">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="group p-2.5 hover:bg-slate-800 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <ArrowLeft
                  size={24}
                  className="text-slate-400 group-hover:text-white transition-colors"
                />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Bình luận</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 relative z-10">
        {/* Manga Info Card - Enhanced Design */}
        {mangaDetail && chapterDetail && (
          <div className="mb-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 lg:p-8">
              {/* Cover Image */}
              <div className="lg:col-span-3 flex justify-center lg:justify-start">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <div className="relative w-48 h-72 rounded-xl overflow-hidden shadow-2xl">
                    <Image
                      alt={mangaDetail.title}
                      src={mangaDetail.cover_image}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </div>
                </div>
              </div>

              {/* Manga Details */}
              <div className="lg:col-span-9 flex flex-col justify-center">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-3xl lg:text-4xl font-black mb-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      {mangaDetail.title}
                    </h2>
                    <p className="text-lg text-slate-400 flex items-center gap-2">
                      <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                      {mangaDetail.author_name}
                    </p>
                  </div>

                  {/* Chapter Info Badge */}
                  <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-lg px-4 py-2">
                    <span className="text-blue-400 font-semibold">
                      Chương {chapterDetail.chapter_number}
                    </span>
                    {chapterDetail.title && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-300">
                          {chapterDetail.title}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-4 py-2.5 border border-slate-600/50">
                      <Star
                        size={20}
                        className="fill-yellow-400 text-yellow-400"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400">Đánh giá</span>
                        <span className="text-lg font-bold text-yellow-400">
                          5.0
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-4 py-2.5 border border-slate-600/50">
                      <MessageCircle size={20} className="text-blue-400" />
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400">
                          Bình luận
                        </span>
                        <span className="text-lg font-bold text-blue-400">
                          {comments.length}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg px-4 py-2.5">
                      <span className="text-sm font-semibold text-blue-300">
                        {mangaDetail.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Comment Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                    <Send size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Viết bình luận
                  </h3>
                </div>

                <form onSubmit={handleSubmitComment} className="space-y-5">
                  {/* Rating */}
                  <div>
                    <label className="block text-slate-300 mb-3 text-sm font-medium">
                      Đánh giá của bạn
                    </label>
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                      {renderStars(newRating, true)}
                      {newRating > 0 && (
                        <p className="text-xs text-slate-400 mt-2">
                          {newRating === 5 && "Tuyệt vời! ⭐"}
                          {newRating === 4 && "Rất tốt! 👍"}
                          {newRating === 3 && "Khá ổn 👌"}
                          {newRating === 2 && "Tạm được 😐"}
                          {newRating === 1 && "Chưa hay 😞"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-slate-300 mb-3 text-sm font-medium">
                      Nội dung
                    </label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Chia sẻ cảm nhận của bạn về manga này..."
                      className="w-full bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all"
                      rows={6}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      {newComment.length}/500 ký tự
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={
                      isSubmitting || !newComment.trim() || newRating === 0
                    }
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/50 disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100"
                  >
                    <Send size={18} />
                    {isSubmitting ? "Đang gửi..." : "Đăng bình luận"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column - Comments List */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <MessageCircle size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Tất cả bình luận
                  </h3>
                </div>
                <span className="bg-slate-700/50 text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-600/50">
                  {comments.length}
                </span>
              </div>

              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex p-4 bg-slate-800/50 rounded-full mb-4">
                      <MessageCircle size={48} className="text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-lg">
                      Chưa có bình luận nào
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      Hãy là người đầu tiên chia sẻ cảm nhận!
                    </p>
                  </div>
                ) : (
                  comments.map((comment, index) => (
                    <div
                      key={comment.comment_id}
                      className="group bg-slate-800/30 hover:bg-slate-800/50 backdrop-blur border border-slate-700/30 hover:border-slate-600/50 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 transform hover:scale-[1.01]"
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {comment.avatar ? (
                              <Image
                                src={comment.avatar}
                                alt={comment.user_name || "User avatar"}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              comment.user_name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* User Info & Rating */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <h4 className="font-bold text-white text-lg">
                                {comment.user_name}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {formatDate(comment.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-lg">
                              {renderStars(comment.rating)}
                            </div>
                          </div>

                          {/* Comment Content */}
                          <p className="text-slate-300 leading-relaxed">
                            {comment.content}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-xs text-slate-500 hover:text-blue-400 transition-colors">
                              Thích
                            </button>
                            <button className="text-xs text-slate-500 hover:text-blue-400 transition-colors">
                              Trả lời
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.9);
        }
      `}</style>
    </div>
  );
}

export default function CommentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CommentContent />
    </Suspense>
  );
}
