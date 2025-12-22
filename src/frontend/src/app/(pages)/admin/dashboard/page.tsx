"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  UserCheck,
  Layers,
  FileText,
  Settings,
  TrendingUp,
  Shield,
  Sparkles,
} from "lucide-react";

export default function Page() {
  const adminFeatures = [
    {
      title: "Quản lý truyện",
      description:
        "Xem, duyệt và quản lý tất cả truyện tranh trên hệ thống. Cập nhật trạng thái, đặt highlight, và kiểm duyệt nội dung.",
      icon: BookOpen,
      href: "/admin/manage-manga",
      color: "blue",
      features: [
        "Duyệt truyện mới đăng tải",
        "Cập nhật trạng thái truyện (Đang tiến hành, Hoàn thành, Tạm ngưng)",
        "Đặt truyện nổi bật với thời gian tùy chỉnh",
        "Quản lý chương: Duyệt, từ chối, đặt giá coin",
        "Xem thông tin chi tiết và thống kê",
      ],
    },
    {
      title: "Quản lý tác giả",
      description:
        "Quản lý danh sách tác giả, duyệt đơn đăng ký và phân quyền cho người dùng muốn trở thành tác giả.",
      icon: UserCheck,
      href: "/admin/manage-authors",
      color: "purple",
      features: [
        "Xem danh sách tất cả tác giả",
        "Duyệt đơn đăng ký tác giả mới",
        "Quản lý thông tin tác giả",
        "Vô hiệu hóa/Kích hoạt tài khoản tác giả",
        "Xem lịch sử đăng tải của tác giả",
      ],
    },
    {
      title: "Quản lý người dùng",
      description:
        "Quản lý toàn bộ người dùng trên nền tảng, kiểm soát quyền truy cập và xử lý vi phạm.",
      icon: Users,
      href: "/admin/manage-users",
      color: "green",
      features: [
        "Xem danh sách người dùng",
        "Phân quyền người dùng (Admin, Tác giả, Người đọc)",
        "Khóa/Mở khóa tài khoản",
        "Xem lịch sử hoạt động",
        "Quản lý báo cáo vi phạm",
      ],
    },
    {
      title: "Quản lý thể loại",
      description:
        "Tạo, chỉnh sửa và xóa các thể loại truyện để phân loại nội dung trên hệ thống.",
      icon: Layers,
      href: "/admin/genre/list",
      color: "amber",
      features: [
        "Thêm thể loại mới",
        "Chỉnh sửa tên và mô tả thể loại",
        "Xóa thể loại không còn sử dụng",
        "Xem số lượng truyện theo thể loại",
        "Sắp xếp và tổ chức thể loại",
      ],
    },
    {
      title: "Đơn đăng ký",
      description:
        "Xử lý các đơn đăng ký từ người dùng muốn trở thành tác giả trên nền tảng.",
      icon: FileText,
      href: "/admin/registration/list",
      color: "rose",
      features: [
        "Xem danh sách đơn đăng ký chờ duyệt",
        "Duyệt hoặc từ chối đơn",
        "Xem thông tin chi tiết người đăng ký",
        "Gửi thông báo phản hồi",
        "Theo dõi lịch sử đơn đăng ký",
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<
      string,
      { bg: string; text: string; border: string; hover: string; icon: string }
    > = {
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        hover: "hover:border-blue-300 hover:bg-blue-50/80",
        icon: "text-blue-600",
      },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        hover: "hover:border-purple-300 hover:bg-purple-50/80",
        icon: "text-purple-600",
      },
      green: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        hover: "hover:border-green-300 hover:bg-green-50/80",
        icon: "text-green-600",
      },
      amber: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        hover: "hover:border-amber-300 hover:bg-amber-50/80",
        icon: "text-amber-600",
      },
      rose: {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        hover: "hover:border-rose-300 hover:bg-rose-50/80",
        icon: "text-rose-600",
      },
    };
    return colors[color];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Quản lý và điều hành hệ thống truyện tranh
              </p>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex items-start gap-4">
            <Sparkles className="w-8 h-8 text-yellow-300 flex-shrink-0 mt-1" />
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-2">
                Chào mừng đến với Bảng điều khiển Admin
              </h2>
              <p className="text-blue-100 leading-relaxed">
                Từ đây bạn có thể quản lý toàn bộ hệ thống. Chọn một trong các
                chức năng bên dưới để bắt đầu. Mỗi phần được thiết kế để giúp
                bạn dễ dàng kiểm soát và điều hành nền tảng một cách hiệu quả.
              </p>
            </div>
          </div>
        </div>

        {/* Admin Features Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" />
            Chức năng quản trị
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {adminFeatures.map((feature, index) => {
              const colors = getColorClasses(feature.color);
              return (
                <Link
                  key={index}
                  href={feature.href}
                  className={`group bg-white border-2 ${colors.border} rounded-2xl p-6 shadow-sm ${colors.hover} transition-all duration-200 hover:shadow-lg`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`${colors.bg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-200`}
                    >
                      <feature.icon className={`w-7 h-7 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold ${colors.text} mb-2`}>
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <div className={`${colors.bg} rounded-xl p-4`}>
                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Tính năng chính:
                    </p>
                    <ul className="space-y-1.5">
                      {feature.features.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-700 flex items-start gap-2"
                        >
                          <span
                            className={`${colors.text} mt-0.5 flex-shrink-0`}
                          >
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    <span
                      className={`text-sm font-semibold ${colors.text} group-hover:gap-2 flex items-center gap-1 transition-all`}
                    >
                      Truy cập
                      <span className="group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Mẹo sử dụng
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    <strong>Quản lý truyện:</strong> Thường xuyên kiểm tra phần
                    truyện chờ duyệt để đảm bảo nội dung được phát hành kịp thời
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    <strong>Highlight truyện:</strong> Sử dụng tính năng đặt
                    truyện nổi bật để quảng bá nội dung chất lượng cao
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    <strong>Đơn đăng ký:</strong> Xử lý đơn đăng ký tác giả
                    trong vòng 24-48h để mang lại trải nghiệm tốt
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    <strong>Giá coin:</strong> Khi duyệt chương, có thể đặt giá
                    coin để kiểm soát nội dung premium
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
