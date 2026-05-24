import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { getAvatarGradient, getInitials } from "@/lib/avatar";

export function Button({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/14 ${className}`}
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass-panel rounded-[28px] p-5 ${className}`}>{children}</div>;
}

export function Pill({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-white/72 ${className}`}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  seed,
  className = "",
}: {
  name: string;
  seed: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${getAvatarGradient(seed)} text-sm font-bold text-white shadow-lg ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
