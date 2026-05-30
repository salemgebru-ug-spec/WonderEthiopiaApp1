"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TourismAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        <p className="text-foreground/40 text-base font-black tracking-widest uppercase italic">Redirecting to Unified Hub...</p>
      </div>
    </div>
  );
}
