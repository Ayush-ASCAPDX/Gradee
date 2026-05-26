import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/rooms");
  }

  return <SignupForm />;
}
