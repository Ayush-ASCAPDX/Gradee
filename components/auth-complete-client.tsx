"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AuthCompleteClient() {
  const router = useRouter();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      router.push("/rooms");
      router.refresh();
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen text-zinc-100 flex items-center justify-center p-4 bg-[#121214] relative overflow-hidden">
      {/* Blob background decorative shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
          <circle cx="50" cy="50" r="35" fill="#8b5cf6" fillOpacity="0.08" />
          <circle cx="20" cy="80" r="25" fill="#09eeb5" fillOpacity="0.03" />
        </svg>
      </div>

      <div className="relative z-10 bg-[#1a1a1e]/40 backdrop-blur-md max-w-md w-full rounded-3xl p-8 text-center shadow-2xl border border-zinc-800 transform scale-100 transition-all duration-300">
        <div className="mx-auto mb-6 h-16 w-16 rounded-full flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
          <span className="material-symbols-outlined text-[32px] text-emerald-400">check_circle</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Authentication Complete!</h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Your Gradee session has been verified. We are preparing your academic workspace...
        </p>
        <div className="flex justify-center items-center gap-2 text-xs text-[#8b5cf6] font-semibold uppercase tracking-wider">
          <span className="h-2 w-2 rounded-full bg-[#8b5cf6] animate-ping" />
          Redirecting to Rooms
        </div>
      </div>
    </div>
  );
}
