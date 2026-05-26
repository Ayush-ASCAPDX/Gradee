"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/types/auth";

const navItems = [
  { href: "/rooms", label: "Live Rooms", icon: "videocam" },
  { href: "#groups", label: "Groups", icon: "groups", disabled: true },
  { href: "/messages", label: "Messages", icon: "chat_bubble" },
  { href: "#notes", label: "Notes Market", icon: "note_stack", disabled: true },
  { href: "/ai-assistant", label: "Ai Assistant", icon: "smart_toy" },
  { href: "/profile", label: "Settings", icon: "settings" },
];

export function AppShell({
  user,
  children,
}: {
  user: User;
  pathname?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="grain min-h-screen overflow-hidden antialiased">
      <main className="grid h-screen overflow-hidden lg:grid-cols-[80px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#1e202b] py-6 flex flex-col items-center lg:flex z-50">
          <div className="flex items-center justify-center">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-plum text-white shadow-soft">
              <span className="material-symbols-outlined">school</span>
            </Link>
          </div>

          <nav className="mt-12 flex w-full flex-col items-center space-y-4 px-3 font-medium">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              
              if (item.disabled) {
                return (
                  <div
                    key={item.label}
                    className="sidebar-link group relative flex h-12 w-12 items-center justify-center rounded-xl cursor-not-allowed transition-all opacity-40 hover:bg-white/5"
                  >
                    <span className="material-symbols-outlined text-[#727a90]">{item.icon}</span>
                    <div className="pointer-events-none absolute left-[3.5rem] z-50 ml-2 rounded-lg bg-[#272b3a] px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 whitespace-nowrap translate-x-[-10px] group-hover:translate-x-0 border border-white/5">
                      {item.label} (Coming Soon)
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link group relative flex h-12 w-12 items-center justify-center rounded-xl cursor-pointer transition-all ${
                    active
                      ? "bg-[#4a62ff] text-white active"
                      : "text-[#727a90] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className={`material-symbols-outlined transition-colors ${active ? "text-white" : "text-[#727a90] group-hover:text-white"}`}>
                    {item.icon}
                  </span>
                  <div className="pointer-events-none absolute left-[3.5rem] z-50 ml-2 rounded-lg bg-[#272b3a] px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 whitespace-nowrap translate-x-[-10px] group-hover:translate-x-0 border border-white/5">
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-3 w-full">
            <button className="group relative flex h-12 w-full items-center justify-center rounded-xl bg-deep text-white shadow-soft transition hover:bg-plum">
              <span className="material-symbols-outlined">bolt</span>
              <div className="pointer-events-none absolute left-[3.5rem] z-50 ml-2 rounded-lg bg-[#272b3a] px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 whitespace-nowrap translate-x-[-10px] group-hover:translate-x-0 border border-white/5">
                Deep Work Session
              </div>
            </button>
          </div>
        </aside>

        <div className="flex h-screen flex-col overflow-hidden">{children}</div>
      </main>
      <span className="sr-only">{user.name}</span>
    </div>
  );
}
