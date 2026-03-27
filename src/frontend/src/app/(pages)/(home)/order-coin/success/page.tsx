/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Home, FileText, Coins } from "lucide-react";
import { useEffect, useState, Suspense } from "react";

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const depositId = searchParams.get("depositId");
  const [depositDetail, setDepositDetail] = useState<any>(null);

  const formatPrice = (price: any) => {
    const n = Number(price);
    if (Number.isNaN(n)) return "0";
    return n.toLocaleString("vi-VN");
  };

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/order-coin/history?depositId=${depositId}`,
      {
        credentials: "include",
      },
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          console.log("Deposit detail data:", data.history);
          setDepositDetail(data.history);
        }
      });
  }, [depositId]);

  return (
    depositDetail && (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Success Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header with animation */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center relative overflow-hidden">
              {/* Animated circles background */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-white rounded-full animate-pulse delay-75"></div>
              </div>

              {/* Success icon with animation */}
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white rounded-full p-4">
                  <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">
                Thanh toán thành công!
              </h1>
              <p className="text-green-100 text-lg">Cảm ơn bạn đã nạp coin</p>
            </div>

            {/* Order details */}
            <div className="p-8">
              {/* Coin badge */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200 mb-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-5xl">🪙</span>
                  <div className="text-left">
                    <p className="text-4xl font-bold text-gray-900">
                      +{depositDetail.coins}
                    </p>
                    <p className="text-amber-600 font-semibold uppercase tracking-wider">
                      Coin
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Coin đã được thêm vào tài khoản của bạn
                </p>
              </div>

              {/* Transaction details */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Chi tiết giao dịch
                </h3>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Mã giao dịch:</span>
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {depositDetail.deposit_id}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-3"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Số coin:</span>
                    <span className="font-semibold text-gray-900">
                      {depositDetail.coins} Coin
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Số tiền:</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(depositDetail.price)}đ
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phương thức:</span>
                    <span className="font-semibold text-gray-900">
                      {depositDetail.payment_method}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Thời gian:</span>
                    <span className="font-semibold text-gray-900">
                      <span>
                        {depositDetail?.created_at
                          ? new Date(depositDetail.created_at).toLocaleString(
                              "vi-VN",
                            )
                          : "—"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Info message */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Biên lai giao dịch đã được gửi đến email của bạn. Bạn có thể
                    kiểm tra lịch sử giao dịch trong phần tài khoản.
                  </span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/")}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  <Home className="w-5 h-5" />
                  Về trang chủ
                </button>

                <button
                  onClick={() => router.push("/order-coin/list")}
                  className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-semibold hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 transition-all duration-300"
                >
                  <Coins className="w-5 h-5" />
                  Nạp thêm coin
                </button>
              </div>

              {/* Auto redirect notice */}
              {/* {depositDetail > 0 && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Tự động chuyển về trang chủ sau {countdown} giây...
                </p>
              )} */}
            </div>
          </div>

          {/* Confetti effect (optional decoration) */}
          <div className="text-center mt-6 text-4xl animate-bounce">
            🎉 🎊 ✨
          </div>
        </div>
      </div>
    )
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
