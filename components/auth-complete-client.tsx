"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Pill } from "@/components/ui";

export function AuthCompleteClient() {
  const router = useRouter();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      router.push("/rooms");
      router.refresh();
    }, 1400);

    return () => window.clearTimeout(timeout);
  }, [router]);

  return (
    <Card className="w-full max-w-lg p-10 text-center">
      <Pill>Authentication Complete</Pill>
      <h1 className="mt-4 text-3xl font-bold text-white">You&apos;re in.</h1>
      <p className="mt-3 text-sm text-white/58">
        Your Gradee session is ready. Redirecting you to the live rooms.
      </p>
    </Card>
  );
}
