import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { RoomsClient } from "@/components/rooms-client";
import { getCurrentUser, sanitizeUser } from "@/lib/auth";

export default async function RoomsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/rooms");
  }

  const safeUser = sanitizeUser(user);

  return (
    <AppShell user={safeUser} pathname="/rooms">
      <RoomsClient currentUser={safeUser} />
    </AppShell>
  );
}
