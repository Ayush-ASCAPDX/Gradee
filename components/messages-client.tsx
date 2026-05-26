"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/http";
import type { User } from "@/types/auth";

type DraftMessage = {
  type: "sent" | "received";
  text: string;
  at: number;
};

function avatarUrl(user: User) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6f53da&color=fff`;
}

export function MessagesClient({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [history, setHistory] = useState<Record<string, DraftMessage[]>>({});

  useEffect(() => {
    apiFetch<{ users: User[] }>("/api/auth/users")
      .then((data) => {
        setUsers(data.users);
        setActiveChatUserId(data.users[0]?.id ?? null);
      })
      .catch(() => {
        setUsers([]);
      });
  }, []);

  const activeUser = useMemo(
    () => users.find((user) => user.id === activeChatUserId) ?? null,
    [activeChatUserId, users],
  );

  const activeMessages = activeChatUserId ? history[activeChatUserId] ?? [] : [];

  function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeChatUserId || !draft.trim()) return;

    setHistory((current) => ({
      ...current,
      [activeChatUserId]: [
        ...(current[activeChatUserId] ?? []),
        { type: "sent", text: draft.trim(), at: Date.now() },
      ],
    }));
    setDraft("");
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
        <div className="soft-ui-nav mx-auto flex max-w-[100vw] items-center justify-between p-2 shadow-float">
          <Link href="/rooms" className="flex h-12 w-12 items-center justify-center rounded-full text-ink/40 transition-all active:scale-90">
            <span className="material-symbols-outlined">videocam</span>
          </Link>
          <Link href="/messages" className="flex h-12 w-12 items-center justify-center rounded-full bg-plum/10 text-plum transition-all active:scale-90">
            <span className="material-symbols-outlined">chat_bubble</span>
          </Link>
          <div className="relative -mt-8">
            <Link
              href="/ai-assistant"
              className="flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-[#8aa1d1] bg-plum text-white shadow-soft transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-3xl">smart_toy</span>
            </Link>
          </div>
          <Link href="/home" className="flex h-12 w-12 items-center justify-center rounded-full text-ink/40 transition-all active:scale-90">
            <span className="material-symbols-outlined">home</span>
          </Link>
          <Link href="/profile" className="flex h-12 w-12 items-center justify-center rounded-full text-ink/40 transition-all active:scale-90">
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
      </nav>

      <section className="flex h-screen flex-col overflow-hidden">
        <div className="grid flex-1 overflow-hidden lg:grid-cols-[360px_1fr]">
          <div className={`flex flex-col border-r border-white/20 bg-white/5 backdrop-blur-sm ${activeUser ? "hidden lg:flex" : "flex"}`}>
            <div className="p-5">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-3 text-xl text-ink/40">search</span>
                <input
                  type="text"
                  placeholder="Search scholars..."
                  className="w-full rounded-2xl border-none bg-ink/5 py-3 pl-12 pr-4 text-sm focus:ring-1 focus:ring-plum"
                />
              </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto px-3 space-y-1">
              {users.length === 0 ? (
                <>
                  <div className="animate-pulse flex gap-4 px-3 py-4">
                    <div className="skeleton h-12 w-12 shrink-0 rounded-2xl" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="skeleton h-4 w-1/2 rounded" />
                      <div className="skeleton h-3 w-3/4 rounded" />
                    </div>
                  </div>
                  <div className="animate-pulse flex gap-4 px-3 py-4">
                    <div className="skeleton h-12 w-12 shrink-0 rounded-2xl" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="skeleton h-4 w-1/3 rounded" />
                      <div className="skeleton h-3 w-1/2 rounded" />
                    </div>
                  </div>
                </>
              ) : (
                users.map((user) => {
                  const preview = (history[user.id] ?? []).at(-1)?.text ?? `@${user.username}`;
                  const active = activeChatUserId === user.id;

                  return (
                    <button
                      key={user.id}
                      onClick={() => setActiveChatUserId(user.id)}
                      className={`w-full rounded-[1.5rem] px-4 py-4 text-left transition-all hover:bg-white/40 ${active ? "bg-white/35" : ""}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <img src={avatarUrl(user)} className="h-12 w-12 rounded-2xl object-cover shadow-soft" alt={user.name} />
                          <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-mint" />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate font-bold text-ink">{user.name}</span>
                            <span className="shrink-0 text-[10px] text-plum">online</span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-ink/60">{preview}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className={`min-h-0 flex-col bg-white/5 ${activeUser ? "flex" : "hidden lg:flex"}`}>
            {activeUser ? (
              <>
                <div className="flex items-center gap-4 border-b border-white/10 px-6 py-4">
                  <button
                    onClick={() => setActiveChatUserId(null)}
                    className="lg:hidden -ml-2 p-2 text-ink/60 transition hover:text-plum"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div className="relative">
                    <img src={avatarUrl(activeUser)} className="h-11 w-11 rounded-2xl object-cover" alt={activeUser.name} />
                    <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-mint" />
                  </div>
                  <div>
                    <h2 className="font-serif text-base font-bold leading-none text-ink lg:text-lg">{activeUser.name}</h2>
                    <p className="mt-1 text-xs text-ink/60">Status: Active</p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => setHistory((current) => ({ ...current, [activeUser.id]: [] }))}
                      className="rounded-xl p-2.5 transition hover:bg-plum hover:text-white glass"
                      title="Clear chat"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                    <button className="rounded-xl p-2.5 transition hover:bg-plum hover:text-white glass">
                      <span className="material-symbols-outlined">call</span>
                    </button>
                    <button className="rounded-xl p-2.5 transition hover:bg-plum hover:text-white glass">
                      <span className="material-symbols-outlined">videocam</span>
                    </button>
                  </div>
                </div>

                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-6 pb-28 lg:pb-6">
                  {activeMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                      <span className="material-symbols-outlined mb-4 text-6xl">forum</span>
                      <p className="font-serif text-xl">Select a scholar to start collaborating</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {activeMessages.map((message, index) => {
                        const isSent = message.type === "sent";
                        return (
                          <div key={`${message.at}-${index}`} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                            <div className={`flex max-w-[85%] gap-4 ${isSent ? "flex-row-reverse" : "flex-row"}`}>
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isSent ? "bg-plum text-white" : "bg-ink text-white"}`}>
                                <span className="material-symbols-outlined text-sm">{isSent ? "person" : "smart_toy"}</span>
                              </div>
                              <div className={`rounded-[1.5rem] px-6 py-4 ${isSent ? "bg-deep text-white shadow-float" : "panel text-ink"}`}>
                                <p className="text-sm leading-relaxed">{message.text}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="shrink-0 px-4 pb-28 pt-4 lg:p-6">
                  <form onSubmit={sendMessage} className="panel flex items-center gap-2 rounded-[2rem] p-2">
                    <button type="button" className="rounded-full p-3 text-ink/40 hover:bg-ink/5">
                      <span className="material-symbols-outlined">add_circle</span>
                    </button>
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      type="text"
                      placeholder={`Type a message as ${currentUser.name}...`}
                      className="flex-1 border-none bg-transparent py-3 text-sm focus:ring-0"
                    />
                    <button
                      type="submit"
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-plum text-white shadow-soft transition hover:bg-deep active:scale-95"
                    >
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                <span className="material-symbols-outlined mb-4 text-6xl">forum</span>
                <p className="font-serif text-xl">Select a scholar to start collaborating</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
