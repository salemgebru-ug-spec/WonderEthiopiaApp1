import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Added the transformers and onnxruntime packages to your existing array here
  serverExternalPackages: ["mongoose", "@xenova/transformers", "onnxruntime-node"],

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
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "visitethiopia.et",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "whc.unesco.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
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
