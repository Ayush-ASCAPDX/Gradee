"use client";

import { useState } from "react";
import Link from "next/link";
import type { User } from "@/types/auth";

export function DashboardClient({ user }: { user: User }) {
  const [searchQuery, setSearchQuery] = useState("");

  const testimonialsRow1 = [
    {
      text: "This platform saved me",
      name: "al.",
      handle: "@blewhesmind",
      avatar: "https://i.pravatar.cc/150?img=47",
      network: "twitter",
    },
    {
      text: "I literally finished all my tasks 😭🥰",
      name: "jei⁷",
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
      text: "This is the best [community] I ever tried 😂",
      name: "Nicole",
      handle: "da.potato_",
      avatar: "https://i.pravatar.cc/150?img=9",
      network: "tiktok",
    },
    {
      text: "The people in the stream are so cool! Just the vibe I needed.",
      name: "♡ หว่ออ้ายสาลี่(♡˙︶˙♡) ~ เปิด blooming 💐",
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

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar w-full pb-10">
      <div className="px-4 py-8 md:px-8 md:py-16 max-w-7xl mx-auto space-y-16">
        
        {/* Welcome Section */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
          <div className="glass rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.28em] text-white/95">
            Welcome back, @{user.username}
          </div>
          <h1 className="font-serif text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.0] tracking-[-0.05em] text-ink">
            What are we mastering today?
          </h1>
          <p className="text-base md:text-xl leading-relaxed text-ink/80 max-w-xl">
            Search resources, launch a focus session, and keep your next subject visible in one calm workspace.
          </p>

          {/* Search bar inside dashboard */}
          <div className="w-full max-w-2xl mt-4">
            <label className="flex w-full items-center gap-3 sm:gap-4 rounded-[1.5rem] border border-white/35 bg-white/20 px-5 py-4 shadow-soft backdrop-blur-xl focus-within:-translate-y-0.5 transition-transform duration-300">
              <span className="material-symbols-outlined text-xl sm:text-2xl text-ink/70">search</span>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-none bg-transparent p-0 text-sm sm:text-base font-semibold text-ink placeholder:text-ink/50 focus:ring-0" 
                placeholder="Search study guides, notes, or focus topics..." 
                type="text" 
              />
            </label>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 max-w-5xl mx-auto">
          {/* Active Focus Room */}
          <article className="panel bg-white/90 rounded-[2rem] p-6 md:p-8 col-span-1 md:col-span-8 flex flex-col justify-between min-h-[300px]">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#efe8ff] text-plum shadow-sm">
                <span className="material-symbols-outlined text-2xl">local_fire_department</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-[#1e202b] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#baf7ce]">
                <span className="h-2 w-2 rounded-full bg-[#baf7ce] animate-pulse" />
                Active Now
              </div>
            </div>
            <div className="my-6">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#1a1b41] tracking-tight">Quiet Study</h2>
              <p className="mt-2.5 flex items-center gap-2 text-sm font-medium text-gray-500">
                <span className="material-symbols-outlined text-[18px]">group</span>
                12 scholars currently active
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex -space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#efe8ff] text-[10px] font-bold text-gray-600 shadow-sm">JD</div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#d8cdfb] text-[10px] font-bold text-gray-600 shadow-sm">AM</div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-plum/20 text-[10px] font-bold text-gray-600 shadow-sm">SR</div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-gray-500 shadow-sm">+9</div>
              </div>
              <Link href="/rooms" className="rounded-full bg-plum hover:bg-deep text-white px-8 py-3 text-sm font-bold shadow-soft hover:-translate-y-0.5 transition-all">
                Enter Room
              </Link>
            </div>
          </article>

          {/* Right Stacked Column */}
          <div className="col-span-1 md:col-span-4 flex flex-col gap-6 md:gap-8">
            {/* Next Session */}
            <article className="panel bg-white/90 rounded-[2rem] p-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-plum">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Next Session</span>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold text-[#1a1b41] tracking-tight">14:30</div>
                <p className="mt-1.5 text-xs font-semibold text-gray-500">Advanced Calculus Sprint</p>
              </div>
            </article>

            {/* Weekly Goal */}
            <article className="panel bg-white/90 rounded-[2rem] p-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-plum">
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Weekly Goal</span>
                </div>
                <span className="text-base font-bold text-[#1a1b41]">82%</span>
              </div>
              <div className="mt-4 h-3.5 w-full overflow-hidden rounded-full bg-[#f4f5f8] border border-slate-100">
                <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-plum to-grape" />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-bold">
                <span className="text-gray-500">24.5 hrs logged</span>
                <span className="text-[#1a1b41]">Target: 30 hrs</span>
              </div>
            </article>
          </div>
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {/* Stat 1 */}
          <article className="panel bg-white/90 rounded-[2rem] p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#efe8ff] text-plum shadow-sm">
              <span className="material-symbols-outlined text-[20px]">timer</span>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Focus Time</div>
              <div className="mt-1 text-xl font-bold text-[#1a1b41]">1,248 hrs</div>
            </div>
          </article>
          
          {/* Stat 2 */}
          <article className="panel bg-white/90 rounded-[2rem] p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#baf7ce]/30 text-emerald-800 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Current Streak</div>
              <div className="mt-1 text-xl font-bold text-[#1a1b41]">14 Days</div>
            </div>
          </article>

          {/* Stat 3 */}
          <article className="panel bg-white/90 rounded-[2rem] p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d8cdfb] text-deep shadow-sm">
              <span className="material-symbols-outlined text-[20px]">military_tech</span>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Global Ranking</div>
              <div className="mt-1 text-xl font-bold text-[#1a1b41]">Top 3%</div>
            </div>
          </article>
        </div>

        {/* Testimonials Marquee Section */}
        <section className="relative overflow-hidden py-8 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-bold">Community Buzz</h2>
            <p className="text-sm text-on-surface-variant mt-1.5">What other academic leaders are saying about their focus layers</p>
          </div>

          <div className="space-y-6">
            {/* Row 1: Left moving marquee */}
            <div className="marquee-container flex overflow-hidden w-full relative">
              <div className="flex animate-marquee-left gap-6 shrink-0 w-max pr-6">
                {[...testimonialsRow1, ...testimonialsRow1].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-4 w-[340px] shrink-0">
                    <div className="bg-white p-5 rounded-[2.0rem] rounded-bl-lg shadow-soft text-xs md:text-sm font-medium text-[#1a1b41] leading-relaxed border border-slate-100">
                      {item.text}
                    </div>
                    <div className="flex items-center gap-2.5 px-2">
                      <img src={item.avatar} className="w-9 h-9 rounded-xl object-cover shadow-sm border border-slate-200" alt="Avatar" />
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1a1b41] text-xs leading-tight">{item.name}</span>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                          <span className="text-[#8b5cf6] font-bold text-[8px] uppercase tracking-widest">{item.network}</span>
                          <span>{item.handle}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2: Right moving marquee */}
            <div className="marquee-container flex overflow-hidden w-full relative">
              <div className="flex animate-marquee-right gap-6 shrink-0 w-max pr-6">
                {[...testimonialsRow2, ...testimonialsRow2].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-4 w-[340px] shrink-0">
                    <div className="bg-white p-5 rounded-[2.0rem] rounded-bl-lg shadow-soft text-xs md:text-sm font-medium text-[#1a1b41] leading-relaxed border border-slate-100">
                      {item.text}
                    </div>
                    <div className="flex items-center gap-2.5 px-2">
                      <img src={item.avatar} className="w-9 h-9 rounded-xl object-cover shadow-sm border border-slate-200" alt="Avatar" />
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1a1b41] text-xs leading-tight">{item.name}</span>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                          <span className="text-[#8b5cf6] font-bold text-[8px] uppercase tracking-widest">{item.network}</span>
                          <span>{item.handle}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
