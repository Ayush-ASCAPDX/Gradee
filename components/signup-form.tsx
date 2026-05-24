"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, LinkButton, Pill } from "@/components/ui";
import { apiFetch } from "@/lib/http";
import type { User } from "@/types/auth";

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", username: "", email: "", otp: "" });
  const [stage, setStage] = useState<"details" | "otp">("details");
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
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
        }),
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
        body: JSON.stringify({
          email: form.email,
          otp: form.otp,
        }),
      });
      router.push("/auth-complete");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to verify OTP.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-[560px] p-8">
      <Pill>Student Signup</Pill>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Create your Gradee account</h1>
      <p className="mt-2 text-sm text-white/58">
        Sign up with your name, username, and email. Verification stays OTP-based.
      </p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm text-white/65">Full name</span>
          <input
            className="field"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-white/65">Username</span>
          <input
            className="field"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-white/65">Email</span>
          <input
            className="field"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
        {stage === "otp" && (
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm text-white/65">OTP</span>
            <input
              className="field tracking-[0.4em]"
              inputMode="numeric"
              maxLength={6}
              value={form.otp}
              onChange={(event) => setForm((current) => ({ ...current, otp: event.target.value }))}
            />
          </label>
        )}
      </div>
      {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      <div className="mt-7 flex flex-wrap gap-3">
        {stage === "details" ? (
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
        <LinkButton href="/login">Back to login</LinkButton>
      </div>
    </Card>
  );
}
