import type { ReactNode } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import type { User } from "@/types/auth";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms" },
  { href: "/messages", label: "Messages" },
  { href: "/ai-assistant", label: "AI Assistant" },
  { href: "/profile", label: "Profile" },
];

export function AppShell({
  user,
  pathname,
  children,
}: {
  user: User;
  pathname: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1500px] gap-4 px-3 py-4 sm:px-5 lg:px-8">
      <aside className="glass-panel hidden w-[248px] shrink-0 flex-col rounded-[30px] p-4 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-3 px-2 py-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[radial-gradient(circle_at_top,#8b5cf6,#4c1d95)] font-black text-white shadow-[0_10px_40px_rgba(139,92,246,0.45)]">
            G
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white">Gradee</div>
            <div className="text-xs text-white/45">The modern student portal</div>
          </div>
        </Link>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-white text-slate-950 shadow-[0_16px_30px_rgba(255,255,255,0.12)]"
                    : "text-white/70 hover:bg-white/6 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                <span className={active ? "text-slate-500" : "text-white/25"}>•</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-[24px] border border-white/8 bg-black/30 p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} seed={user.id} className="h-11 w-11" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{user.name}</div>
              <div className="truncate text-xs text-white/50">@{user.username}</div>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="glass-panel flex items-center justify-between rounded-[26px] px-4 py-3 lg:hidden">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Gradee
          </Link>
          <div className="flex gap-2 overflow-x-auto">
            {navItems.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${
                  pathname === item.href
                    ? "bg-white text-slate-950"
                    : "bg-white/8 text-white/72"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
