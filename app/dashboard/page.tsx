import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DashboardClient } from "@/components/dashboard-client";
import { getCurrentUser, sanitizeUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const safeUser = sanitizeUser(user);

  return (
    <AppShell user={safeUser}>
      <DashboardClient user={safeUser} />
    </AppShell>
  );
}
