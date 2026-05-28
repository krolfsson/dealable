import type { NextConfig } from "next";
import { STORE_SLUGS } from "./src/lib/seo";

function brandSearchRedirects() {
  const out: { source: string; destination: string; permanent: true }[] = [];
  for (const slug of Object.values(STORE_SLUGS)) {
    const dest = `/butik/${slug}`;
    for (const suffix of ["rabattkod", "rea", "rabatt", "kampanj", "erbjudande", "deals", "kampanjkod"]) {
      out.push({ source: `/${slug}-${suffix}`, destination: dest, permanent: true });
    }
    out.push({ source: `/rabattkod/${slug}`,   destination: dest, permanent: true });
    out.push({ source: `/kampanjkod/${slug}`,  destination: dest, permanent: true });
    out.push({ source: `/rea/${slug}`,          destination: dest, permanent: true });
  }
  return out;
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "dealable.se" }],
        destination: "https://www.dealable.se/:path*",
        permanent: true,
      },
      ...brandSearchRedirects(),
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
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
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