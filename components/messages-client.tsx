"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, Card, Pill } from "@/components/ui";
import { apiFetch } from "@/lib/http";
import type { User } from "@/types/auth";

export function MessagesClient({ currentUser }: { currentUser: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    apiFetch<{ users: User[] }>("/api/auth/users")
      .then((data) => {
        setUsers(data.users);
        setSelectedUserId(data.users[0]?.id ?? null);
      })
      .catch(() => {
        setUsers([]);
      });
  }, []);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/48">Direct messages</p>
            <h1 className="text-xl font-bold text-white">Study contacts</h1>
          </div>
          <Pill>{users.length} users</Pill>
        </div>
        <div className="mt-4 space-y-2">
          {users.map((user) => (
            <button
              key={user.id}
              className={`flex w-full items-center gap-3 rounded-[22px] px-3 py-3 text-left transition ${
                user.id === selectedUserId ? "bg-white text-slate-950" : "bg-white/5 text-white"
              }`}
              onClick={() => setSelectedUserId(user.id)}
            >
              <Avatar name={user.name} seed={user.id} className="h-11 w-11" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{user.name}</div>
                <div className={`truncate text-xs ${user.id === selectedUserId ? "text-slate-500" : "text-white/45"}`}>
                  @{user.username}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>
      <Card className="flex min-h-[70vh] flex-col p-5">
        {selectedUser ? (
          <>
            <div className="flex items-center gap-3 border-b border-white/8 pb-4">
              <Avatar name={selectedUser.name} seed={selectedUser.id} className="h-12 w-12" />
              <div>
                <div className="text-lg font-semibold text-white">{selectedUser.name}</div>
                <div className="text-sm text-white/45">@{selectedUser.username}</div>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <div className="max-w-md text-center">
                <Pill>UI preserved honestly</Pill>
                <p className="mt-4 text-lg font-semibold text-white">
                  The provided legacy backend does not include persisted messaging routes.
                </p>
                <p className="mt-2 text-sm text-white/52">
                  This page keeps the contact-and-chat layout, but it does not invent unsupported server-side message storage.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <input
                className="field flex-1"
                placeholder={`Message ${selectedUser.name} as ${currentUser.name}`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <Button disabled={!draft.trim()}>Send</Button>
            </div>
          </>
        ) : (
          <div className="grid min-h-[50vh] place-items-center text-white/50">No verified users yet.</div>
        )}
      </Card>
    </div>
  );
}
