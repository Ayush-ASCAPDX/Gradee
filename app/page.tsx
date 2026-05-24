import Link from "next/link";
import { redirect } from "next/navigation";
import { LinkButton, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/rooms");
  }

  return (
    <main className="hero-grid min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1450px] flex-col rounded-[36px] border border-white/8 bg-black/18 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <header className="flex items-center justify-between rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
          <Link href="/" className="text-xl font-black tracking-tight text-white">
            Gradee
          </Link>
          <div className="flex gap-3">
            <LinkButton href="/login">Login</LinkButton>
            <LinkButton href="/signup" className="bg-white text-slate-950 hover:bg-white/90">
              Get Started
            </LinkButton>
          </div>
        </header>
        <section className="grid flex-1 items-center gap-6 px-2 py-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-3xl">
            <Pill>The modern student portal</Pill>
            <h1 className="mt-6 font-[family-name:var(--font-space-grotesk)] text-5xl font-bold leading-none tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              Study, connect, and focus inside one premium campus workspace.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/62">
              Gradee combines OTP auth, AI reference study, live focus rooms, and student collaboration without changing the original product direction.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/signup" className="bg-white text-slate-950 hover:bg-white/90">
                Create account
              </LinkButton>
              <LinkButton href="/login">I already have an account</LinkButton>
            </div>
          </div>
          <div className="glass-panel rounded-[34px] p-5">
            <div className="grid gap-4">
              {[
                "OTP-based login and signup",
                "Realtime focus rooms with WebRTC",
                "Reference-grounded AI study assistant",
                "Profile and verified-user flows",
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-5 text-white/78">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
