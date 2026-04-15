import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "dealable.se" }],
        destination: "https://www.dealable.se/:path*",
        permanent: true,
      },
    ];
  },
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
      // Jotex / Ellos (Awin feed can expose direct asset URLs)
      {
        protocol: "https",
        hostname: "**.ellosgroup.com",
      },
      {
        protocol: "http",
        hostname: "**.ellosgroup.com",
      },
    ],
  },
};

export default nextConfig;