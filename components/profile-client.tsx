"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/http";
import type { User } from "@/types/auth";

function avatarUrl(user: User) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6f53da&color=fff`;
}

export function ProfileClient({ initialUser }: { initialUser: User }) {
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name);
  const [username, setUsername] = useState(initialUser.username);
  const [saving, setSaving] = useState(false);
  const [saveLabel, setSaveLabel] = useState("Save Changes");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveLabel("Saving...");

    try {
      const data = await apiFetch<{ message: string; user: User }>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
        }),
      });

      setUser(data.user);
      setName(data.user.name);
      setUsername(data.user.username);
      setSaveLabel("Saved");
      window.setTimeout(() => setSaveLabel("Save Changes"), 900);
    } catch (error) {
      setSaveLabel(error instanceof Error ? error.message : "Save failed");
      window.setTimeout(() => setSaveLabel("Save Changes"), 1600);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setName(user.name);
    setUsername(user.username);
  }

  return (
    <section className="h-screen overflow-y-auto px-4 py-6 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="glass flex flex-col gap-4 rounded-[2rem] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <img
              className="h-20 w-20 rounded-[1.6rem] object-cover shadow-soft"
              src={avatarUrl(user)}
              alt="Profile avatar"
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-ink/45">Profile</p>
              <h1 className="font-serif text-3xl font-bold text-ink">{user.name}</h1>
              <p className="mt-1 text-sm text-ink/60">{user.email} • @{user.username}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="panel rounded-[2rem] p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-ink">Edit Profile</h2>
                <p className="mt-2 text-sm text-ink/60">
                  Keep your name and username current across the whole Gradee workspace.
                </p>
              </div>
              <span className="rounded-full bg-white/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-ink/45">
                Secure
              </span>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-ink/45">Full Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border-none bg-white/65 px-5 py-4 text-sm text-ink focus:ring-2 focus:ring-plum/35"
                  maxLength={80}
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-ink/45">Username</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2 w-full rounded-2xl border-none bg-white/65 px-5 py-4 text-sm text-ink focus:ring-2 focus:ring-plum/35"
                  maxLength={30}
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-ink/45">Email</span>
                <input
                  readOnly
                  value={user.email}
                  className="mt-2 w-full rounded-2xl border-none bg-ink/5 px-5 py-4 text-sm text-ink/65 focus:ring-0"
                />
              </label>

              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-plum px-6 py-3 text-sm font-bold text-white transition hover:bg-deep disabled:opacity-60"
                >
                  {saveLabel}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full bg-white/60 px-6 py-3 text-sm font-bold text-ink transition hover:bg-white/85"
                >
                  Reset
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="panel rounded-[2rem] p-6 lg:p-8">
              <h2 className="font-serif text-2xl font-bold text-ink">Account Snapshot</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1.5rem] bg-white/60 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink/45">Member Since</p>
                  <p className="mt-3 text-lg font-semibold text-ink">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })
                      : "-"}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/60 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink/45">Verification</p>
                  <p className="mt-3 text-lg font-semibold text-ink">
                    {user.isVerified ? "Verified account" : "Verification pending"}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-white/60 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink/45">Public Handle</p>
                  <p className="mt-3 text-lg font-semibold text-ink">@{user.username}</p>
                </div>
              </div>
            </section>

            <section className="glass rounded-[2rem] p-6 lg:p-8">
              <h2 className="font-serif text-2xl font-bold text-ink">Tips</h2>
              <ul className="mt-5 space-y-3 text-sm text-ink/65">
                <li className="rounded-2xl bg-white/35 px-4 py-3">
                  Choose a username classmates can recognize quickly in rooms and chats.
                </li>
                <li className="rounded-2xl bg-white/35 px-4 py-3">
                  Your email stays read-only here because it is tied to OTP login security.
                </li>
                <li className="rounded-2xl bg-white/35 px-4 py-3">
                  Use your real name if you want teachers and peers to identify you more easily.
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
