import { redirect } from "next/navigation";
import { AiAssistantClient } from "@/components/ai-assistant-client";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser, sanitizeUser } from "@/lib/auth";

export default async function AiAssistantPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/ai-assistant");
  }

  const safeUser = sanitizeUser(user);

  return (
    <AppShell user={safeUser} pathname="/ai-assistant">
      <AiAssistantClient user={safeUser} />
    </AppShell>
  );
}
