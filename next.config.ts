import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  images: {
    qualities: [100, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "share.google",
        pathname: "/**", // ✅ Fixed from ""
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**", // ✅ Fixed from ""
      },
      {
        protocol: "https",
        hostname: "visitethiopia.et",
        pathname: "/**", // ✅ Fixed from "/"
      },
      {
        protocol: "https",
        hostname: "whc.unesco.org",
        pathname: "/**", // ✅ Fixed from "/"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // ✅ Added explicitly to prevent any default matching errors
      }
    ],
  },

  async rewrites() {
    return [
      {
        source: '/unesco-assets/:path*',
        destination: 'https://whc.unesco.org/:path*',
      },
    ];
  },
};

export default nextConfig;
