"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import type { User } from "@/types/auth";

export function useCurrentUser(initialUser: User | null = null) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    if (initialUser) {
      return;
    }

    let cancelled = false;
    apiFetch<{ user: User }>("/api/auth/me")
      .then((data) => {
        if (!cancelled) {
          setUser(data.user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialUser]);

  return { user, setUser, loading };
}

export async function logout() {
  await apiFetch<{ message: string }>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
