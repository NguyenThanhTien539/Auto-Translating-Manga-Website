import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "**", // hoặc thêm các domain khác bạn cần
      },
    ],
  },
};

export default nextConfig;
