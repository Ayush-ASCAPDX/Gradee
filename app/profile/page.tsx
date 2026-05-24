import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/components/logout-button";
import { ProfileClient } from "@/components/profile-client";
import { Card } from "@/components/ui";
import { getCurrentUser, sanitizeUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/profile");
  }

  const safeUser = sanitizeUser(user);

  return (
    <AppShell user={safeUser} pathname="/profile">
      <Card className="flex items-center justify-between p-4">
        <div>
          <div className="text-sm text-white/48">Account</div>
          <div className="text-xl font-semibold text-white">Profile settings</div>
        </div>
        <LogoutButton />
      </Card>
      <ProfileClient initialUser={safeUser} />
    </AppShell>
  );
}
