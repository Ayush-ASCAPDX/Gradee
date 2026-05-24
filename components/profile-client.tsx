"use client";

import { useState } from "react";
import { Button, Card, Pill } from "@/components/ui";
import { apiFetch } from "@/lib/http";
import type { User } from "@/types/auth";

export function ProfileClient({ initialUser }: { initialUser: User }) {
  const [form, setForm] = useState({
    name: initialUser.name,
    username: initialUser.username,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const data = await apiFetch<{ message: string; user: User }>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setForm({ name: data.user.name, username: data.user.username });
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-3xl p-6">
      <Pill>Profile</Pill>
      <h1 className="mt-4 text-2xl font-bold text-white">Update your public details</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm text-white/65">Name</span>
          <input
            className="field"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label>
          <span className="mb-2 block text-sm text-white/65">Username</span>
          <input
            className="field"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          />
        </label>
      </div>
      <div className="mt-4 text-sm text-white/52">Signed in as {initialUser.email}</div>
      {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      <div className="mt-6">
        <Button className="bg-white text-slate-950 hover:bg-white/90" disabled={saving} onClick={save}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </Card>
  );
}
