import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps heavy node packages from being bundled into serverless functions
  serverExternalPackages: ["mongoose", "@xenova/transformers"],

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Directs Webpack to treat native binary dependencies as external 
      // preventing Vercel build compilation crashes
      config.externals = [...(config.externals || []), {
        "onnxruntime-node": "commonjs onnxruntime-node",
        "sharp": "commonjs sharp",
      }];
    }
    return config;
  },

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
        pathname: "",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "",
      },
      {
        protocol: "https",
        hostname: "visitethiopia.et",
        pathname: "/",
      },
      {
        protocol: "https",
        hostname: "whc.unesco.org",
        pathname: "/",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/unesco-assets/:path*",
        destination: "https://whc.unesco.org/:path*",
      },
    ];
  },
};

export default nextConfig;
