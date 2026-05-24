import { redirect } from "next/navigation";
import { SignupForm } from "@/components/signup-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/rooms");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <SignupForm />
    </main>
  );
}
