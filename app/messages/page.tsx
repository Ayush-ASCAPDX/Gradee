import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MessagesClient } from "@/components/messages-client";
import { getCurrentUser, sanitizeUser } from "@/lib/auth";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/messages");
  }

  const safeUser = sanitizeUser(user);

  return (
    <AppShell user={safeUser} pathname="/messages">
      <MessagesClient currentUser={safeUser} />
    </AppShell>
  );
}
