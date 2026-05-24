"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/client-auth";
import { Button } from "@/components/ui";

export function LogoutButton() {
  const router = useRouter();

  return (
    <Button
      onClick={async () => {
        await logout();
        router.push("/login");
        router.refresh();
      }}
    >
      Logout
    </Button>
  );
}
