import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomePageClient } from "@/components/home-page-client";

export default async function HomeRoutePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/rooms");
  }

  return <HomePageClient />;
}
