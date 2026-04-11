import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    imageSizes: [128, 256, 384, 512, 640],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.productserve.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "**.awin1.com",
      },
    ],
  },
};

export default nextConfig;