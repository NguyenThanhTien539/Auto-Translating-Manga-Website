import type { NextConfig } from "next";
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
      },{
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/api/manga/page-image/**',
      },
    ],
  },
};

export default nextConfig;
