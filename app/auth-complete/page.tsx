import { redirect } from "next/navigation";
import { AuthCompleteClient } from "@/components/auth-complete-client";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthCompletePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <AuthCompleteClient />;
}
