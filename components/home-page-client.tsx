"use client";

import { useEffect } from "react";
import Link from "next/link";

const testimonialsRow1 = [
  {
    text: "This platform saved me",
    name: "al.",
    handle: "@blewhesmind",
    avatar: "https://i.pravatar.cc/150?img=47",
    network: "twitter",
  },
  {
    text: "I literally finished all my tasks",
    name: "jei",
    handle: "@geonjei",
    avatar: "https://i.pravatar.cc/150?img=32",
    network: "twitter",
  },
  {
    text: "yes that's right! joining a study room makes me focus because of the camera and we're all studying",
    name: "Maria Rita",
    handle: "@Eu_Maria",
    avatar: "https://i.pravatar.cc/150?img=5",
    network: "twitter",
  },
  {
    text: "Thank you I've received a very valuable session",
    name: "afwah_02_",
    handle: "afwah_02_",
    avatar: "https://i.pravatar.cc/150?img=11",
    network: "instagram",
  },
];

const testimonialsRow2 = [
  {
    text: "This is the best [community] I ever tried",
    name: "Nicole",
    handle: "da.potato_",
    avatar: "https://i.pravatar.cc/150?img=9",
    network: "tiktok",
  },
  {
    text: "The people in the stream are so cool! Just the vibe I needed.",
    name: "Robotsahi",
    handle: "@robotsahi90",
    avatar: "https://i.pravatar.cc/150?img=12",
    network: "twitter",
  },
  {
    text: "Honestly this changed how I study completely.",
    name: "Sarah J.",
    handle: "sarah_studies",
    avatar: "https://i.pravatar.cc/150?img=33",
    network: "instagram",
  },
  {
    text: "The UI is so clean, I love just leaving it open.",
    name: "DevMark",
    handle: "markcodes",
    avatar: "https://i.pravatar.cc/150?img=68",
    network: "tiktok",
  },
];

function NetworkBadge({ network }: { network: string }) {
  return (
    <span className="text-[#8b5cf6] text-[8px] font-bold uppercase tracking-widest">
      {network}
    </span>
  );
}

export function HomePageClient() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const ring = document.querySelector<HTMLElement>(".cursor-ring");
    const orb = document.querySelector<HTMLElement>(".cursor-orb");
    if (!ring || !orb) return;

    const state = {
      mouseX: window.innerWidth / 2,
      mouseY: window.innerHeight / 2,
      ringX: window.innerWidth / 2,
      ringY: window.innerHeight / 2,
      orbX: window.innerWidth / 2,
      orbY: window.innerHeight / 2,
    };

    const interactiveSelector = "a, button, input, label, article, [role='button']";
    let frameId = 0;

    const animate = () => {
      state.ringX += (state.mouseX - state.ringX) * 0.12;
      state.ringY += (state.mouseY - state.ringY) * 0.12;
      state.orbX += (state.mouseX - state.orbX) * 0.22;
      state.orbY += (state.mouseY - state.orbY) * 0.22;

      ring.style.transform = `translate3d(${state.ringX}px, ${state.ringY}px, 0) translate(-50%, -50%)`;
      orb.style.transform = `translate3d(${state.orbX}px, ${state.orbY}px, 0) translate(-50%, -50%)`;
      frameId = window.requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      state.mouseX = event.clientX;
      state.mouseY = event.clientY;
      document.body.classList.add("cursor-active");
      document.body.classList.toggle("cursor-hover", Boolean((event.target as HTMLElement)?.closest(interactiveSelector)));
    };

    const handleMouseOut = () => {
      document.body.classList.remove("cursor-active", "cursor-hover");
    };

    const handleMouseDown = () => {
      document.body.classList.add("cursor-hover");
    };

    const handleMouseUp = () => {
      document.body.classList.remove("cursor-hover");
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div data-scroll-container>
      <div className="cursor-ring" aria-hidden="true" />
      <div className="cursor-orb" aria-hidden="true" />
      <div className="hero-glow left-[-8rem] top-[8rem]" />
      <div className="hero-glow bottom-[-10rem] right-[-5rem]" />

      <nav className="sticky top-0 z-50 border-b border-white/15 bg-white/18 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
          <Link href="/" className="font-serif text-3xl font-bold tracking-[-0.04em] text-ink md:text-4xl">
            Gradee
          </Link>
          <div className="hidden items-center gap-10 text-sm font-medium text-ink/65 md:flex">
            <Link href="/rooms" className="transition hover:text-ink">Rooms</Link>
            <Link href="/messages" className="transition hover:text-ink">Messages</Link>
            <Link href="/ai-assistant" className="transition hover:text-ink">AI Assistant</Link>
            <a href="#cta" className="transition hover:text-ink">Apply</a>
            <a href="#testimonials" className="transition hover:text-ink">Testimonials</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="glass hidden h-11 w-11 items-center justify-center rounded-full text-ink transition hover:scale-105 sm:flex">
              <span className="material-symbols-outlined">school</span>
            </button>
            <Link href="/signup" className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black sm:px-5 sm:py-3">
              Be a mentor
            </Link>
          </div>
        </div>
      </nav>

      <main className="px-4 pt-10 md:px-8 md:pt-20">
        <section className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 flex max-w-5xl flex-col items-center text-center md:mb-32">
            <div className="glass rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/90">
              Academic deep work portal
            </div>
            <h1 className="mt-6 max-w-4xl font-serif text-[clamp(1.85rem,8.5vw,5.4rem)] leading-[0.94] tracking-[-0.055em] text-ink md:mt-10">
              What are we mastering today?
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/82 md:mt-6 md:text-xl md:leading-8">
              Search resources, launch a focus session, and keep your next subject visible in one calm workspace.
            </p>
          </div>

          <div id="features" className="mx-auto mt-10 max-w-5xl md:mt-16">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-7">
              <article className="panel !bg-white rounded-[2rem] p-6 transition duration-500 md:col-span-8 md:p-8 flex min-h-[320px] flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#efe8ff] text-plum shadow-sm">
                    <span className="material-symbols-outlined">local_fire_department</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-[#1e202b] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#baf7ce]">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#baf7ce] animate-pulse" />
                    Active
                  </div>
                </div>
                <div className="mb-12 mt-8">
                  <h2 className="font-serif text-4xl font-bold tracking-tight text-[#1a1b41] md:text-5xl">Focus Room 1</h2>
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-500">
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    12 scholars currently active
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#eef0f7] text-[10px] font-bold text-gray-600 shadow-sm">JD</div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#eef0f7] text-[10px] font-bold text-gray-600 shadow-sm">AM</div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#eef0f7] text-[10px] font-bold text-gray-600 shadow-sm">SR</div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#f4f5f8] text-[10px] font-bold text-gray-500 shadow-sm">+9</div>
                  </div>
                  <Link href="/rooms" className="rounded-full bg-[#5f48cd] px-8 py-3 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-[#4d3ab3]">
                    Join Room
                  </Link>
                </div>
              </article>

              <div className="md:col-span-4 flex flex-col gap-5 md:gap-7">
                <article className="panel !bg-white rounded-[2rem] p-6 transition duration-500 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-[#5f48cd]">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Next Session</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-4xl font-medium tracking-tight text-[#1a1b41] md:text-5xl">14:30</div>
                    <p className="mt-2 text-xs font-medium text-gray-500">Advanced Calculus - Session Start</p>
                  </div>
                </article>

                <article className="panel !bg-white rounded-[2rem] p-6 transition duration-500 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#5f48cd]">
                      <span className="material-symbols-outlined text-[18px]">trending_up</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Weekly Goal</span>
                    </div>
                    <span className="text-lg font-bold text-[#1a1b41]">82%</span>
                  </div>
                  <div className="mt-5 h-3.5 w-full overflow-hidden rounded-full bg-[#f4f5f8]">
                    <div className="h-full w-[82%] rounded-full bg-[#5f48cd]" />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs font-medium">
                    <span className="text-gray-500">24h Deep Work</span>
                    <span className="font-bold text-[#1a1b41]">Target: 30h</span>
                  </div>
                </article>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 md:mt-7 md:gap-7">
              {[
                ["timer", "Total Focus Time", "1,248 hrs"],
                ["bolt", "Current Streak", "14 Days"],
                ["military_tech", "Global Ranking", "Top 3%"],
              ].map(([icon, label, value]) => (
                <article key={label} className="panel !bg-white rounded-[2rem] p-5 md:p-6 flex items-center gap-4 transition duration-500">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f4f5f8] text-[#1a1b41]">
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</div>
                    <div className="mt-1 text-xl font-medium text-[#1a1b41]">{value}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <section id="testimonials" className="relative mt-20 overflow-hidden py-10 pb-20 md:mt-32">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#eef1fa] to-transparent md:w-64" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#eef1fa] to-transparent md:w-64" />

        <div className="marquee-container relative flex w-full overflow-hidden">
          <div className="flex w-max shrink-0 gap-8 pr-8 animate-marquee-left">
            {[...testimonialsRow1, ...testimonialsRow1].map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex w-[380px] shrink-0 flex-col gap-5">
                <div className="rounded-[2.5rem] rounded-bl-xl bg-white p-7 text-sm font-medium leading-relaxed text-[#1a1b41] shadow-soft">
                  {item.text}
                </div>
                <div className="flex items-center gap-3 px-2">
                  <img src={item.avatar} className="h-11 w-11 rounded-2xl object-cover shadow-sm" alt={item.name} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold leading-tight text-[#1a1b41]">{item.name}</span>
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                      <NetworkBadge network={item.network} />
                      {item.handle}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="marquee-container relative mt-16 flex w-full overflow-hidden md:mt-20">
          <div className="flex w-max shrink-0 gap-8 pr-8 animate-marquee-right">
            {[...testimonialsRow2, ...testimonialsRow2].map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex w-[380px] shrink-0 flex-col gap-5">
                <div className="rounded-[2.5rem] rounded-tl-xl bg-white p-7 text-sm font-medium leading-relaxed text-[#1a1b41] shadow-soft">
                  {item.text}
                </div>
                <div className="flex items-center gap-3 px-2">
                  <img src={item.avatar} className="h-11 w-11 rounded-2xl object-cover shadow-sm" alt={item.name} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold leading-tight text-[#1a1b41]">{item.name}</span>
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                      <NetworkBadge network={item.network} />
                      {item.handle}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-deep/95 px-5 py-12 text-white md:px-8 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div>
            <div className="font-serif text-3xl font-bold tracking-[-0.04em] md:text-4xl">Gradee</div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/72">
              Empowering elite scholars with precision-engineered digital focus tools.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold">Platform</div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/72">
              <a href="#features" className="transition hover:text-white">Features</a>
              <a href="#faculty" className="transition hover:text-white">Faculty</a>
              <a href="#testimonials" className="transition hover:text-white">Testimonials</a>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold">Support</div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/72">
              <a href="#" className="transition hover:text-white">Privacy Policy</a>
              <a href="#" className="transition hover:text-white">Terms of Service</a>
            </div>
          </div>
          <div id="cta">
            <div className="text-sm font-semibold">Stay Updated</div>
            <div className="mt-4 flex gap-2">
              <input
                type="email"
                placeholder="Email"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-white/30 focus:ring-0"
              />
              <button className="rounded-xl bg-[#2282ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1671ea]">
                Go
              </button>
            </div>
            <p className="mt-4 text-xs text-white/45">(c) 2024 Gradee Academic Excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
