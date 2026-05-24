import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/rooms");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <LoginForm />
    </main>
  );
}
