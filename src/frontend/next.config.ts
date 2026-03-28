import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  images: {
    unoptimized: true, // Disable Next.js image optimization
    qualities: [75, 100], // Add quality 100
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "**", // hoặc thêm các domain khác bạn cần
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/api/mangas/page-image/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
