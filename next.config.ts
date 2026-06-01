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
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "visitethiopia.et",
        pathname: "/**"
      }, {
        protocol: "https",
        hostname: "whc.unesco.org",
        pathname: "/**"
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
