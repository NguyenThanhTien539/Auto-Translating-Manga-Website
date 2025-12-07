/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPrice } from "@/utils/format";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Wallet,
  QrCode,
  CheckCircle2,
} from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  icon: any;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "momo",
    name: "Ví MoMo",
    icon: Smartphone, // MoMo là ví trên điện thoại -> Smartphone là hợp lý
    description: "Thanh toán siêu tốc qua ứng dụng MoMo",
  },
  {
    id: "zalopay",
    name: "Ví ZaloPay",
    icon: Wallet, // ZaloPay là ví điện tử -> Dùng icon Wallet
    description: "Thanh toán qua ví ZaloPay hoặc ứng dụng Zalo",
  },
  {
    id: "vnpay",
    name: "VNPay-QR",
    icon: QrCode, // VNPay đặc trưng là quét mã -> Dùng icon QrCode
    description: "Quét mã QR qua ứng dụng ngân hàng/VNPay",
  },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const params = useParams();
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/detail/${params.id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.code == "success") setOrderDetail(data.orderDetail);
        else setOrderDetail(null);
      });
  }, []);

  return (
    orderDetail && (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Quay lại</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Chi tiết đơn hàng
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side - Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Package Info Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  Gói đã chọn
                </h2>

                <div className="flex items-center justify-between bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-200">
                  <div className="flex items-center gap-4">
                    <div className="text-6xl">🪙</div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">
                        {orderDetail.coins}
                      </p>
                      <p className="text-amber-600 font-semibold uppercase tracking-wider">
                        Coin
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">
                      Tổng thanh toán
                    </p>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatPrice(orderDetail.price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-amber-600" />
                  Phương thức thanh toán
                </h2>

                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                          selectedPayment === method.id
                            ? "border-amber-400 bg-amber-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-amber-200 hover:bg-gray-50"
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                            selectedPayment === method.id
                              ? "bg-amber-100 text-amber-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {method.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {method.description}
                          </p>
                        </div>

                        {/* Selected indicator */}
                        {selectedPayment === method.id && (
                          <CheckCircle2 className="w-6 h-6 text-amber-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right side - Payment Summary (Sticky) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Tóm tắt thanh toán
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Số coin:</span>
                    <span className="font-semibold text-gray-900">
                      {orderDetail.coins}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Đơn giá:</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(orderDetail.price)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900">
                      Tổng cộng:
                    </span>
                    <span className="text-xl font-bold text-amber-600">
                      {formatPrice(orderDetail.price)}
                    </span>
                  </div>
                </div>

                {/* Selected payment info */}
                {selectedPayment && (
                  <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-gray-600 mb-1">
                      Thanh toán qua:
                    </p>
                    <p className="font-semibold text-gray-900">
                      {
                        paymentMethods.find((m) => m.id === selectedPayment)
                          ?.name
                      }
                    </p>
                  </div>
                )}

                {/* Payment button */}
                <button
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                    !selectedPayment
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-gray-900 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2"></span>
                  {selectedPayment
                    ? "Xác nhận thanh toán"
                    : "Chọn phương thức thanh toán"}
                </button>

                {/* Security note */}
                <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
                  <svg
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Giao dịch được bảo mật và mã hóa. Thông tin thanh toán của
                    bạn được bảo vệ an toàn.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
