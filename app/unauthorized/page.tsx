"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function UnauthorizedPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-3 md:px-4 lg:px-5">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-500/[0.04] rounded-full blur-[150px]" />
      </div>

      <div
        className={`relative z-10 text-center max-w-md transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/[0.08] border border-red-500/20 mb-8">
          <svg
            className="w-10 h-10 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        {/* Text */}
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
          Access Denied
        </h1>
        <p className="text-[15px] text-gray-500 leading-relaxed mb-8">
          You don&apos;t have permission to access this page. If you believe this
          is an error, please contact your administrator.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-3 md:px-4 lg:px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-black text-base font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-3 md:px-4 lg:px-5 py-3 border border-white/[0.08] text-base font-medium text-gray-400 rounded-full hover:text-white hover:border-white/[0.15] transition-all duration-300"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
