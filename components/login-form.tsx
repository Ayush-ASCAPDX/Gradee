"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, LinkButton, Pill } from "@/components/ui";
import { apiFetch } from "@/lib/http";
import type { User } from "@/types/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"email" | "otp">("email");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp() {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const data = await apiFetch<{ message: string }>("/api/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage(data.message);
      setStage("otp");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to request OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setBusy(true);
    setError(null);

    try {
      await apiFetch<{ message: string; user: User }>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      const next = searchParams.get("next") || "/auth-complete";
      router.push(next);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to verify OTP.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-[460px] p-8">
      <Pill>OTP Login</Pill>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Welcome back to Gradee</h1>
      <p className="mt-2 text-sm text-white/58">
        Continue with your email and we&apos;ll send a one-time passcode.
      </p>
      <div className="mt-7 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-white/65">Email</span>
          <input
            className="field"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {stage === "otp" && (
          <label className="block">
            <span className="mb-2 block text-sm text-white/65">OTP</span>
            <input
              className="field tracking-[0.4em]"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
          </label>
        )}
      </div>
      {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      <div className="mt-7 flex flex-wrap gap-3">
        {stage === "email" ? (
          <Button className="bg-white text-slate-950 hover:bg-white/90" disabled={busy} onClick={requestOtp}>
            {busy ? "Sending..." : "Request OTP"}
          </Button>
        ) : (
          <>
            <Button className="bg-white text-slate-950 hover:bg-white/90" disabled={busy} onClick={verifyOtp}>
              {busy ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button disabled={busy} onClick={requestOtp}>
              Resend OTP
            </Button>
          </>
        )}
        <LinkButton href="/signup">Create account</LinkButton>
      </div>
    </Card>
  );
}
