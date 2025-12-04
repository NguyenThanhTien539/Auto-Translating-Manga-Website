"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  X,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
} from "lucide-react";
import dynamic from "next/dynamic";
import TinyMCEEditor from "@/app/components/TinyMCEEditor";
// const TinyMCEEditor = dynamic(() => import("@/app/components/TinyMCEEditor"), {
//   ssr: false,
// });

type ReaderApplication = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  username: string;
  reason: string;
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

// Dữ liệu giả để test UI
const MOCK_APPLICATIONS: ReaderApplication[] = [
  {
    id: 1,
    full_name: "Nguyễn Văn An",
    email: "nguyenvanan@gmail.com",
    phone: "0901234567",
    address: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    username: "vanan123",
    reason: `
      <h3>Lý do đăng ký</h3>
      <p>Tôi là một người <strong>đam mê đọc truyện tranh</strong> và muốn đóng góp vào cộng đồng người đọc.</p>
      <h4>Kinh nghiệm của tôi:</h4>
      <ul>
        <li>Có kinh nghiệm dịch thuật tiếng Nhật sang tiếng Việt</li>
        <li>Đã đọc và theo dõi manga/manhwa hơn 5 năm</li>
        <li>Hiểu rõ văn hóa và ngôn ngữ trong các bộ truyện</li>
      </ul>
      <h4>Cam kết:</h4>
      <p>Tôi cam kết sẽ:</p>
      <ol>
        <li>Hoạt động tích cực và thường xuyên trên nền tảng</li>
        <li>Tuân thủ mọi quy định của trang web</li>
        <li>Đóng góp chất lượng cho cộng đồng</li>
      </ol>
      <p><em>Rất mong được trở thành thành viên của cộng đồng!</em></p>
    `,
    status: "pending",
    created_at: "2024-12-04T10:30:00",
  },
  {
    id: 2,
    full_name: "Trần Thị Bích Ngọc",
    email: "bichngoc.tran@outlook.com",
    phone: "0912345678",
    address: "456 Lê Lợi, Quận 3, TP. Hồ Chí Minh",
    username: "bichngoc_reader",
    reason: `
      <p>Là một <strong>fan hâm mộ manga/manhwa lâu năm</strong>, tôi mong muốn được tham gia vào cộng đồng để chia sẻ đam mê với mọi người.</p>
      <p>Tôi thường xuyên cập nhật các bộ truyện mới và có kiến thức tốt về thể loại này.</p>
    `,
    status: "accepted",
    created_at: "2024-12-03T14:20:00",
  },
  {
    id: 3,
    full_name: "Lê Minh Tuấn",
    email: "minhtuan.le99@yahoo.com",
    phone: "0923456789",
    address: "789 Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh",
    username: "tunale_99",
    reason: `
      <p>Tôi đã đọc truyện trên nhiều nền tảng khác nhau và nhận thấy trang web này có tiềm năng phát triển tốt.</p>
      <p>Tôi muốn được tham gia để giới thiệu các bộ truyện hay cho cộng đồng độc giả Việt Nam.</p>
    `,
    status: "rejected",
    created_at: "2024-12-02T09:15:00",
  },
];

export default function RegistrationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const editorRef = useRef(null);

  const [application, setApplication] = useState<ReaderApplication | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    // Simulate API call với dữ liệu giả
    setTimeout(() => {
      const mockApp = MOCK_APPLICATIONS.find((app) => app.id === Number(slug));
      if (mockApp) {
        setApplication(mockApp);
      } else {
        toast.error("Không tìm thấy đơn đăng ký");
      }
      setLoading(false);
    }, 500);

    // Code thật khi có API:
    /*
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/registration/detail/${slug}`,
      {
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          setApplication(data.application);
        } else {
          toast.error(data.message || "Không tìm thấy đơn đăng ký");
        }
      })
      .catch(() => {
        toast.error("Có lỗi xảy ra khi tải dữ liệu");
      })
      .finally(() => {
        setLoading(false);
      });
    */
  }, [slug]);

  const handleStatusChange = (newStatus: "accepted" | "rejected") => {
    if (!application) return;

    const confirmMessage =
      newStatus === "accepted"
        ? "Bạn có chắc muốn chấp nhận đơn đăng ký này?"
        : "Bạn có chắc muốn từ chối đơn đăng ký này?";

    if (!confirm(confirmMessage)) return;

    // Simulate API call
    setTimeout(() => {
      toast.success(
        newStatus === "accepted"
          ? "Đã chấp nhận đơn đăng ký"
          : "Đã từ chối đơn đăng ký"
      );
      setApplication({ ...application, status: newStatus });
    }, 300);

    // Code thật khi có API:
    /*
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PATH_ADMIN}/registration/update-status/${application.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          toast.success(data.message);
          setApplication({ ...application, status: newStatus });
        } else {
          toast.error(data.message || "Có lỗi xảy ra");
        }
      })
      .catch(() => {
        toast.error("Có lỗi xảy ra khi cập nhật trạng thái");
      });
    */
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500 text-sm sm:text-base">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <div className="text-gray-500 text-center text-sm sm:text-base">
          Không tìm thấy đơn đăng ký
        </div>
        <button
          onClick={() => router.push("/admin/registration/list")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">
          Chi tiết đơn đăng ký
        </h2>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header Section with Status */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {application.full_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} className="flex-shrink-0" />
                  <span className="font-medium">@{application.username}</span>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-3">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${
                    application.status === "pending"
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                      : application.status === "accepted"
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : "bg-red-100 text-red-600 border border-red-300"
                  }`}
                >
                  {application.status === "pending"
                    ? "⏳ Chờ duyệt"
                    : application.status === "accepted"
                    ? "✓ Đã chấp nhận"
                    : "✗ Đã từ chối"}
                </span>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Calendar size={16} className="flex-shrink-0" />
                  <span>{formatDate(application.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {/* Contact Information Cards */}
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Thông tin liên hệ
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Email Card */}
                <div className="group bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Mail size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Email
                      </label>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {application.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone Card */}
                <div className="group bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Phone size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Số điện thoại
                      </label>
                      <p className="text-sm font-medium text-gray-900">
                        {application.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Username Card */}
                <div className="group bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <User size={20} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Username
                      </label>
                      <p className="text-sm font-medium text-gray-900">
                        {application.username}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Card */}
                <div className="group bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <MapPin size={20} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Địa chỉ
                      </label>
                      <p className="text-sm font-medium text-gray-900 break-words">
                        {application.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason Section with TinyMCE */}
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                Lý do xin nộp đơn
              </h4>
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <TinyMCEEditor
                  value={application.reason}
                  editorRef={editorRef}
                  isReadOnly={true}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 border-t border-gray-200">
            <div className="flex flex-col items-center gap-3">
              {application.status === "pending" && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleStatusChange("accepted")}
                    className="flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-emerald-500 text-white text-sm sm:text-base font-semibold hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Check size={20} />
                    Chấp nhận đơn
                  </button>
                  <button
                    onClick={() => handleStatusChange("rejected")}
                    className="flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-red-500 text-white text-sm sm:text-base font-semibold hover:bg-red-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <X size={20} />
                    Từ chối đơn
                  </button>
                </div>
              )}

              <button
                onClick={() => router.push("/admin/registration/list")}
                className="flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={18} />
                Quay lại trang danh sách
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
