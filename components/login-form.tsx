"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/http";
import type { User } from "@/types/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"email" | "otp">("email");
  const [busy, setBusy] = useState(false);
  
  // Cooldown timer state
  const [resendCooldown, setResendCooldown] = useState(0);

  // Custom modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("error");

  const showCustomModal = (title: string, message: string, type: "success" | "error" = "error") => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalOpen(true);
  };

  // Cooldown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
  };

  async function handleInitialSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stage === "email") {
      setBusy(true);
      try {
        await apiFetch<{ message: string }>("/api/auth/request-otp", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        setStage("otp");
        showCustomModal(
          "OTP Sent!",
          "Please check your email address for the 6-digit verification code.",
          "success"
        );
        startCooldown(60);
      } catch (err) {
        showCustomModal(
          "Login Failed",
          err instanceof Error ? err.message : "Failed to request OTP."
        );
      } finally {
        setBusy(false);
      }
    } else {
      if (otp.length !== 6) {
        showCustomModal("Invalid Code", "Please enter a 6-digit verification code.");
        return;
      }
      setBusy(true);
      try {
        await apiFetch<{ message: string; user: User }>("/api/auth/verify-otp", {
          method: "POST",
          body: JSON.stringify({ email, otp }),
        });
        showCustomModal("Logged In!", "Welcome back to Gradee.", "success");
        const next = searchParams.get("next") || "/auth-complete";
        setTimeout(() => {
          router.push(next);
          router.refresh();
        }, 1500);
      } catch (err) {
        showCustomModal(
          "Verification Failed",
          err instanceof Error ? err.message : "Verification failed."
        );
      } finally {
        setBusy(false);
      }
    }
  }

  async function handleResendOtp() {
    setResendCooldown(60);
    try {
      await apiFetch<{ message: string }>("/api/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      showCustomModal(
        "New Code Sent!",
        "A fresh 6-digit verification code has been dispatched to your email.",
        "success"
      );
    } catch (err) {
      showCustomModal(
        "Resend Failed",
        err instanceof Error ? err.message : "Failed to resend OTP."
      );
      setResendCooldown(0);
    }
  }

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col justify-between overflow-x-hidden relative w-full bg-[#121214]">
      {/* Custom Alert Modal */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 ${
          modalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div 
          className={`bg-[#1a1a1e]/90 backdrop-blur-md max-w-sm w-full mx-4 rounded-3xl p-6 shadow-2xl border border-zinc-800 transform transition-all duration-300 ${
            modalOpen ? "scale-100" : "scale-95"
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div 
              className={`h-14 w-14 rounded-full flex items-center justify-center mb-4 ${
                modalType === "success" 
                  ? "bg-emerald-500/10 border border-emerald-500/20" 
                  : "bg-red-500/10 border border-red-500/20"
              }`}
            >
              <span className={`material-symbols-outlined text-[28px] leading-none ${
                modalType === "success" ? "text-emerald-400" : "text-red-400"
              }`}>
                {modalType === "success" ? "check_circle" : "error"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{modalTitle}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">{modalMessage}</p>
            <button 
              onClick={() => setModalOpen(false)}
              className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 active:scale-[0.98] text-sm"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>

      <main className="min-h-screen w-full flex flex-col lg:flex-row">
        {/* Left Panel: Login Form */}
        <div className="w-full lg:w-[45%] bg-[#121214] flex flex-col justify-between px-6 py-8 sm:p-12 md:p-16 min-h-screen lg:min-h-0 border-r border-zinc-900 z-10">
          {/* Top Branding */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 font-semibold text-white tracking-wide hover:opacity-85 transition-opacity group">
              <div className="h-9 w-9 bg-[#8b5cf6]/10 rounded-xl flex items-center justify-center border border-[#8b5cf6]/20 group-hover:border-[#8b5cf6]/40 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-[#8b5cf6] leading-none">school</span>
              </div>
              <span className="text-xl tracking-tight font-bold">Gradee</span>
            </Link>
          </div>

          {/* Center Form */}
          <div className="my-auto py-6 sm:py-12 max-w-sm w-full mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none">Login</h1>
            <p className="text-zinc-400 mt-2.5 text-sm sm:text-base font-normal">Passwordless verification flow</p>

            <form onSubmit={handleInitialSubmit} className="mt-6 sm:mt-10 space-y-4 sm:space-y-6">
              {stage === "email" ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Email Input */}
                  <div className="relative group">
                    <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-[#8b5cf6]">Email</label>
                    <input 
                      id="email" 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-b border-zinc-800 focus:border-[#8b5cf6] text-zinc-100 py-2.5 sm:py-3.5 outline-none text-[14px] sm:text-[15px] transition-colors placeholder-zinc-700"
                      placeholder="Enter your email address" 
                    />
                  </div>
                </div>
              ) : (
                /* OTP Input */
                <div className="space-y-4 pt-2">
                  <div className="relative group">
                    <label htmlFor="otp" className="block text-xs font-semibold uppercase tracking-widest text-[#8b5cf6]">Verification Code (OTP)</label>
                    <input 
                      id="otp" 
                      type="text" 
                      maxLength={6} 
                      inputMode="numeric" 
                      pattern="[0-9]*"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-transparent border-b border-zinc-800 focus:border-[#8b5cf6] text-zinc-100 py-2.5 outline-none text-center tracking-[1em] text-xl font-bold transition-colors placeholder-zinc-800"
                      placeholder="------" 
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                    <span>Didn&apos;t receive code?</span>
                    <button 
                      type="button" 
                      disabled={resendCooldown > 0}
                      onClick={handleResendOtp} 
                      className="font-semibold text-[#8b5cf6] hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      Resend OTP
                    </button>
                  </div>
                  {resendCooldown > 0 && (
                    <div className="text-center text-xs text-zinc-500">
                      Resend available in {resendCooldown}s
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3 sm:pt-4">
                <button 
                  type="submit" 
                  disabled={busy}
                  className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold py-3 sm:py-4 px-6 rounded-full transition-all duration-300 shadow-lg shadow-[#8b5cf6]/10 hover:shadow-[#8b5cf6]/20 active:scale-[0.98] text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {stage === "email" ? (
                    <>
                      <span>{busy ? "Sending..." : "Send OTP"}</span>
                      <span className={`material-symbols-outlined text-[18px] ${busy ? "animate-spin" : ""}`}>
                        {busy ? "sync" : "arrow_forward"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{busy ? "Verifying..." : "Verify & Login"}</span>
                      <span className={`material-symbols-outlined text-[18px] ${busy ? "animate-spin" : ""}`}>
                        {busy ? "sync" : "vpn_key"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Nav */}
          <div className="flex items-center justify-between gap-4 border-t border-zinc-900/60 pt-6">
            <span className="text-xs sm:text-sm text-zinc-500 font-normal">Don&apos;t have an account?</span>
            <Link href="/signup" className="inline-flex justify-center items-center px-6 py-3 rounded-full bg-[#242428] hover:bg-zinc-800 text-xs sm:text-sm font-semibold text-white transition-all duration-300 active:scale-95">
              Sign up
            </Link>
          </div>
        </div>

        {/* Right Panel: Creative branding & Illustrations */}
        <div className="hidden lg:flex w-full lg:w-[55%] bg-[#8b5cf6] relative overflow-hidden flex-col justify-between p-16 text-white">
          {/* Blob background decorative shapes */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
              <circle cx="90" cy="10" r="45" fill="white" fillOpacity="0.06" />
              <path d="M-15 50 C 15 65, 30 35, 65 60 C 85 75, 95 80, 115 95 L -15 95 Z" fill="white" fill-opacity="0.04" />
              <path d="M-30 30 C 20 15, 50 55, 110 20 L 110 -20 L -30 -20 Z" fill="black" fill-opacity="0.03" />
              <circle cx="20" cy="75" r="30" fill="white" fill-opacity="0.05" />
            </svg>
          </div>

          {/* Header Content */}
          <div className="relative z-10 max-w-md">
            <h2 className="text-[2.85rem] font-bold tracking-tight text-white leading-[1.1]">
              Welcome to <br />student portal
            </h2>
            <p className="text-purple-100/75 mt-3 text-base font-normal tracking-wide">Login to access your account</p>
          </div>

          {/* High fidelity custom graphic illustration */}
          <div className="relative z-10 flex-1 flex items-end justify-center w-full mt-10">
            <svg className="w-full max-w-[490px] h-auto drop-shadow-[0_25px_40px_rgba(0,0,0,0.18)]" viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M420 300 C430 250, 460 220, 470 280 C480 340, 450 350, 420 350 Z" fill="#121214" stroke="#121214" strokeWidth="2.5" />
              <path d="M400 320 C420 280, 450 260, 450 310 C450 360, 420 360, 400 360 Z" fill="#ffffff" stroke="#121214" strokeWidth="2.5" />
              <path d="M435 280 L445 330" stroke="#121214" strokeWidth="2" />
              <path d="M410 305 L425 340" stroke="#121214" strokeWidth="2" />
              <path d="M375 340 C385 285, 415 275, 405 325 C395 375, 385 365, 375 340 Z" fill="#121214" stroke="#121214" strokeWidth="2.5" />
              <rect x="230" y="195" width="165" height="210" rx="18" fill="#ffffff" stroke="#121214" strokeWidth="3.5" />
              <line x1="265" y1="230" x2="315" y2="230" stroke="#121214" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="265" y1="258" x2="365" y2="258" stroke="#121214" strokeWidth="3" strokeLinecap="round" />
              <line x1="265" y1="286" x2="365" y2="286" stroke="#121214" strokeWidth="3" strokeLinecap="round" />
              <line x1="265" y1="314" x2="335" y2="314" stroke="#121214" strokeWidth="3" strokeLinecap="round" />
              <path d="M395 345 H430 L422 400 H403 Z" fill="#121214" stroke="#121214" strokeWidth="2.5" />
              <g transform="translate(38, 10)">
                <path d="M164 240 C154 240, 149 250, 152 265 C155 280, 167 280, 171 265 C173 250, 169 240, 164 240 Z" fill="#ffffff" stroke="#121214" strokeWidth="2.5" />
                <path d="M192 320 L180 388 H165" stroke="#121214" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M165 388 L163 393 H150" stroke="#121214" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M205 320 L219 378 H234" stroke="#121214" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M234 378 L237 383 H247" stroke="#121214" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M165 255 C175 250, 205 250, 210 270 C215 290, 210 320, 200 330 C190 340, 170 335, 165 315 Z" fill="#ffffff" stroke="#121214" strokeWidth="3" />
                <line x1="188" y1="255" x2="188" y2="325" stroke="#121214" strokeWidth="2.5" />
                <circle cx="198" cy="214" r="14" fill="#ffffff" stroke="#121214" strokeWidth="3" />
                <path d="M187 212 C187 200, 205 195, 212 210 C210 205, 195 205, 187 212 Z" fill="#121214" />
                <path d="M185 270 L214 295 L204 310" fill="none" stroke="#121214" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="209" y="295" width="8" height="15" rx="1.5" transform="rotate(25 209 295)" fill="#121214" />
                <circle cx="210" cy="302" r="3" fill="#ffffff" stroke="#121214" strokeWidth="1.5" />
              </g>
              <g transform="translate(230, 252)">
                <circle cx="45" cy="45" r="32" fill="#ffffff" fillOpacity="0.1" stroke="#121214" strokeWidth="4.5" />
                <line x1="68" y1="68" x2="108" y2="108" stroke="#121214" strokeWidth="7.5" strokeLinecap="round" />
              </g>
              <g transform="translate(130, -50)">
                <path d="M210 290 L248 290 L258 350 H283" fill="none" stroke="#121214" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M283 350 L285 355 H295" stroke="#121214" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M190 290 L228 290 L233 340 H248" fill="none" stroke="#121214" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M248 340 L250 345 H260" stroke="#121214" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M175 220 C185 205, 215 205, 225 220 C230 230, 230 270, 225 285 C220 295, 185 295, 175 285 Z" fill="#ffffff" stroke="#121214" strokeWidth="3" />
                <circle cx="205" cy="180" r="14" fill="#ffffff" stroke="#121214" strokeWidth="3" />
                <path d="M194 177 C194 165, 212 160, 219 175 C217 170, 202 170, 194 177 Z" fill="#121214" />
                <path d="M200 240 L233 242 L243 230" fill="none" stroke="#121214" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M230 260 L273 260 L283 225" fill="none" stroke="#121214" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="275" y1="235" x2="280" y2="245" stroke="#121214" strokeWidth="1.5" />
                <path d="M232 263 H270" stroke="#121214" strokeWidth="4.5" strokeLinecap="round" />
              </g>
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
}
