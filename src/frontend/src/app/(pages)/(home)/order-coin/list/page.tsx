"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/utils/format";
interface CoinPackage {
  id: number;
  coins: number;
  price: number;
}

export default function OrderListPage() {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const navigate = useRouter();
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/order-coin/list`)
      .then((response) => response.json())
      .then((data) => {
        if (data.code == "success") setCoinPackages(data.coinPackages);
        else setCoinPackages([]);
      });
  }, []);

  const selectedPrice = selectedPackage
    ? coinPackages.find((p) => p.id === selectedPackage)?.price
    : 0;

  const getCoinIconSize = (coins: number) => {
    if (coins <= 7) return "text-3xl";
    if (coins <= 35) return "text-4xl";
    if (coins <= 111) return "text-5xl";
    if (coins <= 251) return "text-6xl scale-110";
    if (coins <= 391) return "text-6xl scale-125";
    return "text-7xl scale-150";
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8 sm:py-12 px-4">
      <div className="w-full max-w-7xl">
        {/* Title Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
            Nạp Coin
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Chọn gói coin phù hợp với bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ================= LEFT SIDE - Payment Summary ================= */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-8">
              <div className="w-full max-w-sm mx-auto flex flex-col gap-4 sm:gap-6">
                {/* Character/Manga image */}
                <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden border-4 border-amber-500 shadow-2xl group">
                  <Image
                    src="/image/logo.jpg"
                    alt="Manga Character"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    priority
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>

                {/* Payment Button */}
                <button
                  disabled={!selectedPackage}
                  className={`
                    relative w-full group overflow-hidden rounded-xl p-3 sm:p-4 transition-all duration-300
                    ${
                      !selectedPackage
                        ? "bg-gray-200 cursor-not-allowed opacity-70 grayscale"
                        : "cursor-pointer bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-xl shadow-amber-500/40 hover:scale-[1.02] hover:shadow-amber-500/60 active:scale-[0.98]"
                    }
                  `}
                  onClick={() => {
                    if (selectedPackage) {
                      navigate.push(`/order-coin/detail/${selectedPackage}`);
                    }
                  }}
                >
                  {/* Shine effect */}
                  {selectedPackage && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent z-10"></div>
                  )}

                  <div className="relative z-20 flex flex-col items-center justify-center text-white">
                    <span className="text-xs sm:text-sm font-medium uppercase tracking-widest opacity-90 mb-1">
                      {selectedPackage
                        ? "Tổng thanh toán"
                        : "Vui lòng chọn gói"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl font-black tracking-tight">
                        {selectedPackage && selectedPrice
                          ? formatPrice(selectedPrice)
                          : "---"}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Note */}
                <p className="text-center text-xs text-gray-400">
                  Thanh toán an toàn & nhận xu ngay lập tức
                </p>
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDE - Coin Packages Grid ================= */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {coinPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 cursor-pointer transition-all duration-300 border-2 ${
                    selectedPackage === pkg.id
                      ? "ring-4 ring-amber-400 shadow-2xl shadow-amber-500/30 scale-105 border-amber-400"
                      : "border-gray-300 hover:border-amber-400/50 hover:scale-102 hover:shadow-lg"
                  }`}
                >
                  {/* ... Nội dung gói coin giữ nguyên ... */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div
                        className={`${getCoinIconSize(
                          pkg.coins
                        )} transition-transform duration-300`}
                      >
                        🪙
                      </div>
                      {selectedPackage === pkg.id && (
                        <div className="absolute inset-0 bg-amber-400 opacity-30 rounded-full blur-2xl animate-pulse"></div>
                      )}
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <p className="text-gray-900 font-bold text-2xl mb-1">
                      {pkg.coins}
                    </p>
                    <p className="text-amber-600 font-semibold text-sm uppercase tracking-wider">
                      Coin
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-6 py-2.5 rounded-xl shadow-lg border border-amber-400/50">
                      <p className="text-white font-bold text-base">
                        {formatPrice(pkg.price)}
                      </p>
                    </div>
                  </div>

                  {selectedPackage === pkg.id && (
                    <div className="absolute -top-2 -right-2 bg-amber-400 rounded-full p-2 shadow-lg animate-bounce">
                      <svg
                        className="w-6 h-6 text-gray-900"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-500/30 rounded-tl-lg"></div>
                  <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-500/30 rounded-br-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
