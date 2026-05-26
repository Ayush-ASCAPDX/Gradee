"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function LandingPageClient() {
  const [loaderHidden, setLoaderHidden] = useState(false);
  const [loaderRemoved, setLoaderRemoved] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cursorActive, setCursorActive] = useState(false);
  const [cursorHover, setCursorHover] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const cursorOrbRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  // Hide the page loader
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLoaderHidden(true);
    }, 2000);

    const timer2 = setTimeout(() => {
      setLoaderRemoved(true);
    }, 2600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Monitor scroll to update navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Custom Cursor orb and ring physics
  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let orbX = 0;
    let orbY = 0;
    let ringX = 0;
    let ringY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!cursorActive) setCursorActive(true);
    };

    const handleMouseLeaveDoc = () => {
      setCursorActive(false);
    };

    const handleMouseEnterDoc = () => {
      setCursorActive(true);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeaveDoc);
    document.addEventListener("mouseenter", handleMouseEnterDoc);

    const tick = () => {
      // Lerp for smooth trailing effect
      orbX += (mouseX - orbX) * 0.25;
      orbY += (mouseY - orbY) * 0.25;
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;

      if (cursorOrbRef.current) {
        cursorOrbRef.current.style.transform = `translate3d(${orbX}px, ${orbY}px, 0) translate3d(-50%, -50%, 0)`;
      }
      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate3d(-50%, -50%, 0)`;
      }

      requestAnimationFrame(tick);
    };

    const animId = requestAnimationFrame(tick);

    // Watch for hover targets
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.classList.contains("mouse-tilt") ||
        target.closest(".mouse-tilt")
      ) {
        setCursorHover(true);
      } else {
        setCursorHover(false);
      }
    };

    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeaveDoc);
      document.removeEventListener("mouseenter", handleMouseEnterDoc);
      window.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(animId);
    };
  }, [cursorActive]);

  // Interactive Mouse Tilt & Shine Effect
  useEffect(() => {
    const mouseTiltElements = document.querySelectorAll<HTMLElement>(".mouse-tilt");

    const handleMouseMove = (e: MouseEvent, el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      el.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
      el.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);
      el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    };

    const handleMouseLeave = (el: HTMLElement) => {
      el.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
    };

    const listeners = Array.from(mouseTiltElements).map((el) => {
      const moveHandler = (e: MouseEvent) => handleMouseMove(e, el);
      const leaveHandler = () => handleMouseLeave(el);

      el.addEventListener("mousemove", moveHandler);
      el.addEventListener("mouseleave", leaveHandler);

      return { el, moveHandler, leaveHandler };
    });

    return () => {
      listeners.forEach(({ el, moveHandler, leaveHandler }) => {
        el.removeEventListener("mousemove", moveHandler);
        el.removeEventListener("mouseleave", leaveHandler);
      });
    };
  }, [loaderRemoved]);

  // Focus Particles System (rendered in environment section)
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    const mouse = { x: 0, y: 0, active: false };

    const resizeCanvas = () => {
      canvas.width = section.offsetWidth;
      canvas.height = section.offsetHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    section.addEventListener("mousemove", handleMouseMove);
    section.addEventListener("mouseleave", handleMouseLeave);

    class Particle {
      x = 0;
      y = 0;
      size = 0;
      speedX = 0;
      speedY = 0;
      opacity = 0;

      constructor() {
        this.init();
      }

      init() {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.5 + 0.1;
      }

      update() {
        if (!canvas) return;
        this.x += this.speedX;
        this.y += this.speedY;

        if (mouse.active) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 150) {
            this.x -= dx * 0.01;
            this.y -= dy * 0.01;
          }
        }

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.init();
        }
      }

      draw(cContext: CanvasRenderingContext2D) {
        cContext.fillStyle = `rgba(111, 251, 190, ${this.opacity})`;
        cContext.beginPath();
        cContext.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        cContext.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < 60; i++) {
        particles.push(new Particle());
      }
    };
    initParticles();

    let animFrameId: number;
    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });
      animFrameId = requestAnimationFrame(animateParticles);
    };
    animateParticles();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animFrameId);
    };
  }, [loaderRemoved]);

  // Scroll Reveal Observer
  useEffect(() => {
    const revealElements = document.querySelectorAll(".reveal-fade-up, .reveal-scale-in");
    
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -80px 0px"
    });

    revealElements.forEach((el) => revealObserver.observe(el));

    return () => {
      revealElements.forEach((el) => revealObserver.unobserve(el));
    };
  }, [loaderRemoved]);

  return (
    <div className={`bg-surface-bright text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden antialiased ${cursorActive ? "cursor-active" : ""} ${cursorHover ? "cursor-hover" : ""}`}>
      {/* Custom Cursor HTML */}
      <div ref={cursorOrbRef} className="cursor-orb" />
      <div ref={cursorRingRef} className="cursor-ring" />

      {/* Page Loader */}
      {!loaderRemoved && (
        <div 
          className={`page-loader ${loaderHidden ? "is-hidden" : ""}`} 
          id="page-loader" 
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-8 text-center text-white">
            <div className="loader-core flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(107,56,212,0.2)] backdrop-blur-xl">
                <span className="material-symbols-outlined text-3xl text-tertiary-fixed">school</span>
              </div>
              <div>
                <div className="font-serif text-3xl tracking-tight">Gradee</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.28em] text-white/50">Loading focus layer</div>
              </div>
            </div>
            <div className="loader-track relative h-[2px] w-56 overflow-hidden rounded-full bg-white/10" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-500 py-4 sm:py-6 ${
          isScrolled ? "glass-nav py-3 sm:py-4 shadow-2xl shadow-primary/5" : ""
        }`} 
        id="navbar"
      >
        <div className="flex items-center px-[20px] md:px-[48px] max-w-[1280px] mx-auto justify-between">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:rotate-[15deg] transition-all duration-500">
              <span className="material-symbols-outlined text-xl sm:text-2xl">school</span>
            </div>
            <div 
              className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors duration-500 ${
                isScrolled ? "text-primary" : "text-white"
              }`} 
              id="nav-logo"
            >
              Gradee
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-12">
            <a 
              className={`nav-link-hover text-[14px] font-bold ${
                isScrolled ? "text-primary" : "text-primary"
              }`} 
              href="#"
            >
              Features
            </a>
            <a 
              className={`nav-link-hover text-[14px] font-medium transition-colors ${
                isScrolled ? "text-on-surface-variant" : "text-white/80 hover:text-white"
              }`} 
              href="#"
            >
              Faculty
            </a>
            <a 
              className={`nav-link-hover text-[14px] font-medium transition-colors ${
                isScrolled ? "text-on-surface-variant" : "text-white/80 hover:text-white"
              }`} 
              href="#"
            >
              Testimonials
            </a>
            <a 
              className={`nav-link-hover text-[14px] font-medium transition-colors ${
                isScrolled ? "text-on-surface-variant" : "text-white/80 hover:text-white"
              }`} 
              href="#"
            >
              About
            </a>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/login" 
              className={`px-3 py-2 text-xs sm:text-sm sm:px-6 sm:py-2.5 font-semibold transition-all ${
                isScrolled ? "text-on-surface hover:text-primary" : "text-white/90 hover:text-white"
              }`}
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              className="px-4 py-2 text-[11px] sm:text-sm sm:px-8 sm:py-3 rounded-full bg-primary text-white font-semibold shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all glow-active"
            >
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#8fa6d6_0%,#8da4d4_34%,#8aa1d1_65%,#859ccc_100%)] pt-28 sm:pt-36">
        <div 
          className="absolute inset-0 opacity-60" 
          style={{
            backgroundImage: `
              radial-gradient(circle at 12px 18px, rgba(255,255,255,0.9) 0 1.4px, transparent 1.8px),
              radial-gradient(circle at 72px 44px, rgba(255,255,255,0.55) 0 1px, transparent 1.5px),
              radial-gradient(circle at 118px 84px, rgba(255,255,255,0.72) 0 1.6px, transparent 2px),
              radial-gradient(circle at 42px 102px, rgba(255,255,255,0.42) 0 0.9px, transparent 1.3px)
            `,
            backgroundSize: "140px 140px"
          }}
        />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/20 to-transparent" />
        <div className="absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/18 blur-[120px]" />
        <div className="absolute bottom-[-8rem] left-[-4rem] h-72 w-72 rounded-full bg-white/12 blur-[120px]" />
        <div className="absolute right-[-5rem] top-[22%] h-80 w-80 rounded-full bg-[#d9e4ff]/25 blur-[120px]" />
        
        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-9rem)] max-w-[1280px] flex-col items-center justify-center px-[20px] pb-20 text-center md:px-[48px]">
          <div className="hero-text-anim inline-flex rounded-full border border-white/35 bg-white/14 px-6 py-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.28em] text-white/95 backdrop-blur-xl">
            Academic Deep Work Portal
          </div>
          <h1 className="hero-text-anim stagger-1 mx-auto mt-8 sm:mt-12 max-w-6xl font-serif text-[clamp(2.25rem,9vw,7.8rem)] leading-[1.0] sm:leading-[0.9] tracking-[-0.04em] sm:tracking-[-0.06em] text-[#0b140d]">
            What are we mastering today?
          </h1>
          <p className="hero-text-anim stagger-2 mx-auto mt-6 sm:mt-10 max-w-4xl text-base sm:text-xl md:text-2xl lg:text-[clamp(1.25rem,2vw,2.1rem)] leading-[1.55] text-[#0d1b18]/88">
            Search resources, launch a focus session, and keep your next subject visible in one calm workspace.
          </p>
          <div className="hero-text-anim stagger-2 mt-8 sm:mt-14 w-full max-w-5xl">
            <label className="mx-auto flex w-full items-center gap-3 sm:gap-4 rounded-[1.5rem] sm:rounded-[2rem] border border-white/35 bg-white/18 px-5 py-4 sm:px-6 sm:py-6 shadow-[0_30px_90px_rgba(54,73,120,0.18)] backdrop-blur-2xl transition-all duration-500 focus-within:-translate-y-1 md:px-8 md:py-7">
              <span className="material-symbols-outlined text-2xl sm:text-4xl text-white/85">search</span>
              <input 
                className="w-full border-none bg-transparent p-0 text-base sm:text-xl font-semibold text-white placeholder:text-white/70 focus:ring-0 md:text-2xl" 
                placeholder="Search resources or start a subject session..." 
                type="text" 
              />
              <span className="hidden rounded-[1.2rem] border border-white/35 px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.18em] text-white/90 md:inline-flex md:min-w-[92px]">
                Ctrl K
              </span>
            </label>
          </div>
          <div className="hero-text-anim stagger-2 mt-8 sm:mt-14">
            <Link 
              href="/signup" 
              className="mouse-tilt shine-effect inline-flex items-center gap-3 rounded-[1.2rem] sm:rounded-[1.6rem] bg-[#07110b] px-6 py-4 sm:px-10 sm:py-5 text-base sm:text-xl font-semibold text-white shadow-[0_24px_60px_rgba(11,20,13,0.24)] transition-all duration-500 hover:-translate-y-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">bolt</span>
              Start Deep Work
            </Link>
          </div>
        </div>
      </section>

      {/* Gradee Video Section */}
      <section className="py-20 sm:py-40 bg-surface-container-highest relative overflow-hidden">
        <div className="bg-glow -top-32 left-[10%] bg-primary/10" />
        <div className="bg-glow -bottom-32 right-[8%] bg-secondary/10" />
        <div className="max-w-[1280px] mx-auto px-[20px] md:px-[48px] relative z-10">
          <div className="grid gap-12 sm:gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="space-y-6 sm:space-y-8 reveal-fade-up">
              <span className="text-secondary font-bold text-xs uppercase tracking-[0.2em]">What is Gradee</span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-primary leading-[1.1] sm:leading-[1.06]">
                See how Gradee turns scattered study time into a focused academic system.
              </h2>
              <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed max-w-xl">
                Use this section to introduce the platform, explain the student journey, and show how mentorship, study hubs, and focus tools work together in one experience.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-white text-primary font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/10">
                  Platform Overview
                </div>
                <div className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-primary text-white font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20">
                  Student Experience
                </div>
              </div>
            </div>
            <div className="reveal-scale-in">
              <div className="glass-card rounded-[2.0rem] sm:rounded-[2.8rem] p-3 sm:p-4 shadow-[0_40px_90px_-25px_rgba(21,21,125,0.22)]">
                <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.2rem] bg-slate-950">
                  <video 
                    className="w-full aspect-video object-cover bg-slate-950" 
                    controls 
                    preload="metadata" 
                    poster="https://picsum.photos/seed/gradee-sec2/1600/900"
                  >
                    <source src="" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-6 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur-xl">
                    Gradee Intro Video
                  </div>
                </div>
              </div>
              <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-on-surface-variant/80">
                Replace the empty video source in this section with your Gradee intro video file when ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-20 sm:py-48 bg-white relative overflow-hidden">
        <div className="bg-glow -top-48 -right-48 bg-primary/5" />
        <div className="max-w-[1280px] mx-auto px-[20px] md:px-[48px] relative z-10">
          <div className="text-center mb-16 sm:mb-32 reveal-fade-up">
            <span className="text-secondary font-bold text-xs uppercase tracking-[0.2em] mb-4 sm:mb-6 block">The Methodology</span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-primary">How Excellence is Built</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mt-6 sm:mt-8 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 sm:gap-16 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group reveal-scale-in hover:scale-105 transition-all duration-500">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-slate-100 text-primary flex items-center justify-center mb-6 sm:mb-8 relative z-10 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all duration-700">
                <span className="material-symbols-outlined text-3xl sm:text-4xl group-hover:scale-110 transition-transform">person_add</span>
              </div>
              <div className="step-line relative w-full h-0" />
              <h4 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 group-hover:text-secondary transition-colors duration-300">
                Join Gradee
              </h4>
              <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                Create your profile and define your academic goals for the semester.
              </p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center group reveal-scale-in hover:scale-105 transition-all duration-500 delay-75">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-emerald-50 text-[#002f1e] flex items-center justify-center mb-6 sm:mb-8 relative z-10 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-2xl group-hover:shadow-emerald-950/20 transition-all duration-700">
                <span className="material-symbols-outlined text-3xl sm:text-4xl group-hover:scale-110 transition-transform">psychology</span>
              </div>
              <div className="step-line relative w-full h-0" />
              <h4 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 group-hover:text-secondary transition-colors duration-300">
                Match with Faculty
              </h4>
              <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                Get paired with a world-class mentor tailored to your specific field.
              </p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group reveal-scale-in hover:scale-105 transition-all duration-500 delay-150">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-purple-50 text-[#6b38d4] flex items-center justify-center mb-6 sm:mb-8 relative z-10 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-2xl group-hover:shadow-secondary/20 transition-all duration-700">
                <span className="material-symbols-outlined text-3xl sm:text-4xl group-hover:scale-110 transition-transform">laptop_mac</span>
              </div>
              <div className="step-line relative w-full h-0" />
              <h4 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 group-hover:text-secondary transition-colors duration-300">
                Enter Study Zone
              </h4>
              <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                Gain access to our high-tech ergonomic physical and digital hubs.
              </p>
            </div>
            {/* Step 4 */}
            <div className="flex flex-col items-center text-center group reveal-scale-in hover:scale-105 transition-all duration-500 delay-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-primary text-white flex items-center justify-center mb-6 sm:mb-8 relative z-10 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-2xl group-hover:shadow-primary/30 transition-all duration-700">
                <span className="material-symbols-outlined text-3xl sm:text-4xl group-hover:scale-110 transition-transform">emoji_events</span>
              </div>
              <h4 className="font-serif text-xl sm:text-2xl mb-3 sm:mb-4 group-hover:text-secondary transition-colors duration-300">
                Achieve Excellence
              </h4>
              <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                Experience consistent improvement and reach your GPA targets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Faculty Section */}
      <section className="py-20 sm:py-48 bg-surface-container-highest relative overflow-hidden">
        <div className="bg-glow -bottom-64 -left-64 bg-secondary/10" />
        <div className="max-w-[1280px] mx-auto px-[20px] md:px-[48px] relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-center">
            <div className="w-full lg:w-1/2 space-y-8 lg:space-y-12 reveal-fade-up">
              <div className="space-y-4 sm:space-y-6">
                <span className="text-secondary font-bold text-xs uppercase tracking-[0.2em]">Expert Mentorship</span>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-primary leading-[1.15] sm:leading-[1.1]">
                  Learn from Pioneers, <br />
                  <span className="text-gradient">Not Just Teachers.</span>
                </h2>
                <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed max-w-xl">
                  Our faculty isn&apos;t just about lectures; it&apos;s about curated growth. We handpick industry leaders and academic pioneers committed to personalized mentorship.
                </p>
              </div>
              <div className="space-y-6 sm:space-y-8 pt-2">
                <div className="flex items-start gap-4 sm:gap-6 p-5 sm:p-8 rounded-3xl hover:bg-white hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group border border-transparent hover:border-white/50 hover:-translate-y-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-800 shrink-0 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                    <span className="material-symbols-outlined text-xl sm:text-2xl">verified_user</span>
                  </div>
                  <div>
                    <h5 className="font-serif text-lg sm:text-xl text-primary mb-1.5 sm:mb-2 group-hover:translate-x-1 transition-transform">
                      PhD-Led Curriculums
                    </h5>
                    <p className="text-sm sm:text-base text-on-surface-variant">
                      Courses designed and delivered by top-tier academic doctors and subject matter experts.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 sm:gap-6 p-5 sm:p-8 rounded-3xl hover:bg-white hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group border border-transparent hover:border-white/50 hover:-translate-y-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-purple-800 shrink-0 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                    <span className="material-symbols-outlined text-xl sm:text-2xl">forum</span>
                  </div>
                  <div>
                    <h5 className="font-serif text-lg sm:text-xl text-primary mb-1.5 sm:mb-2 group-hover:translate-x-1 transition-transform">
                      24/7 Digital Access
                    </h5>
                    <p className="text-sm sm:text-base text-on-surface-variant">
                      Instant connectivity with mentors and peers whenever inspiration or focus strikes.
                    </p>
                  </div>
                </div>
              </div>
              <button className="group flex items-center gap-4 text-primary font-bold text-base sm:text-lg hover:text-secondary transition-all">
                Meet all 120+ Faculty Members
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-3">east</span>
              </button>
            </div>
            
            <div className="w-full lg:w-1/2 max-w-md lg:max-w-none mx-auto reveal-scale-in">
              <div className="mouse-tilt shine-effect relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] group cursor-pointer aspect-[4/5]">
                <img 
                  alt="Lead Faculty Portrait" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out" 
                  src="https://picsum.photos/seed/gradee-faculty-portrait/1200/1500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/20 to-transparent flex flex-col justify-end p-6 sm:p-12 opacity-0 group-hover:opacity-100 transition-all duration-700">
                  <div className="glass-card p-6 sm:p-10 rounded-[1.5rem] sm:rounded-3xl border-white/30 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-700 delay-100">
                    <div className="flex justify-between items-start mb-4 sm:mb-6">
                      <div>
                        <span className="text-secondary font-bold text-[10px] uppercase tracking-[0.2em] mb-1 sm:mb-2 block">
                          Featured Educator
                        </span>
                        <h3 className="font-serif text-2xl sm:text-3xl text-primary">Dr. Elena Rodriguez</h3>
                      </div>
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-primary/20 flex items-center justify-center bg-primary/5">
                        <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">school</span>
                      </div>
                    </div>
                    <p className="text-on-surface-variant text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed italic">
                      &ldquo;My goal is to transform passive learning into active mastery by creating cognitive bridges for every unique student profile.&rdquo;
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                        Stanford Alum
                      </span>
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                        15+ Yrs Exp
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-6 left-6 right-6 sm:bottom-12 sm:left-12 sm:right-12 group-hover:opacity-0 transition-opacity duration-500">
                  <div className="glass-card p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-2xl backdrop-blur-3xl bg-white/40">
                    <h3 className="font-serif text-xl sm:text-2xl text-primary mb-1">Dr. Elena Rodriguez</h3>
                    <p className="text-on-surface-variant text-xs font-bold tracking-wide uppercase">
                      Lead Research Coordinator
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Environment Section */}
      <section 
        ref={sectionRef} 
        className="relative py-20 sm:py-48 bg-primary overflow-hidden" 
        id="environment-section"
      >
        <canvas ref={canvasRef} id="focus-particles" />
        <div className="absolute inset-0 opacity-20">
          <img 
            alt="High tech desk" 
            className="w-full h-full object-cover grayscale" 
            src="https://picsum.photos/seed/gradee-digital-hub/1600/1000" 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-secondary/40" />
        </div>
        <div className="max-w-[1280px] mx-auto px-[20px] md:px-[48px] relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
            <div className="reveal-scale-in">
              <div className="relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl group cursor-crosshair">
                <img 
                  alt="Ergonomic focus space" 
                  className="w-full aspect-square object-cover transition-transform duration-[3000ms] group-hover:scale-110" 
                  src="https://picsum.photos/seed/gradee-ergonomic-zone/1000/1000" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-6 left-6 sm:top-10 sm:left-10 flex gap-3 sm:gap-4">
                  <div className="px-4 py-2 sm:px-6 sm:py-2.5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full text-white font-bold text-[9px] sm:text-xs uppercase tracking-widest shadow-xl">
                    Digital Hub
                  </div>
                  <div className="px-4 py-2 sm:px-6 sm:py-2.5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full text-[#4edea3] font-bold text-[9px] sm:text-xs uppercase tracking-widest shadow-xl">
                    Ergonomic
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 lg:space-y-12 text-white reveal-fade-up">
              <div className="space-y-4 sm:space-y-6">
                <span className="text-tertiary-fixed font-bold text-xs uppercase tracking-[0.2em]">The Gradee Space</span>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-white leading-tight">
                  Productivity <br />
                  <span className="italic font-normal">by Design</span>
                </h2>
                <p className="text-white/70 text-base sm:text-lg leading-relaxed">
                  We believe environment is the silent educator. Our zones are meticulously engineered with circadian lighting, noise-cancellation tech, and Herman Miller ergonomics to sustain deep-focus sessions.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:gap-12 py-4">
                <div className="space-y-2 group cursor-default">
                  <div className="text-tertiary-fixed font-serif text-4xl sm:text-6xl transition-transform duration-700 group-hover:scale-110 origin-left">
                    40%
                  </div>
                  <p className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Increase in focus duration</p>
                </div>
                <div className="space-y-2 group cursor-default">
                  <div className="text-tertiary-fixed font-serif text-4xl sm:text-6xl transition-transform duration-700 group-hover:scale-110 origin-left">
                    0ms
                  </div>
                  <p className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Lag with fiber terminals</p>
                </div>
              </div>
              <Link 
                href="/signup" 
                className="mouse-tilt shine-effect inline-block text-center px-8 py-4 sm:px-10 sm:py-5 rounded-full bg-white text-primary font-serif text-base sm:text-lg hover:bg-emerald-200 hover:scale-105 active:scale-95 transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
              >
                Tour the Facility
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 sm:py-48 bg-white relative overflow-hidden">
        <div className="bg-glow top-0 left-1/4 bg-primary/5" />
        <div className="max-w-[1280px] mx-auto px-[20px] md:px-[48px] relative z-10">
          <div className="text-center mb-16 sm:mb-32 space-y-4 sm:space-y-6 reveal-fade-up">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-primary">Voices of Excellence</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto text-base sm:text-lg">
              Join a community of thousands who have redefined their academic trajectory.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
            {/* Testimonial 1 */}
            <div className="reveal-scale-in glass-card p-6 sm:p-12 rounded-[1.8rem] sm:rounded-[2.5rem] hover:shadow-[0_25px_50px_-12px_rgba(21,21,125,0.15)] hover:-translate-y-4 transition-all duration-700 group flex flex-col justify-between">
              <div className="space-y-6 sm:space-y-8">
                <div className="flex gap-1.5 sm:gap-2 text-secondary">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`material-symbols-outlined fill-1 text-xl sm:text-2xl group-hover:scale-110 transition-transform`}
                      style={{ transitionDelay: `${i * 30}ms` }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="text-base sm:text-lg italic text-on-surface leading-relaxed group-hover:translate-x-1 transition-transform">
                  &ldquo;Gradee completely transformed how I approach my thesis. The library environment is unmatched for deep focus sessions that lasted hours.&rdquo;
                </p>
              </div>
              <div className="mt-8 sm:mt-12 flex items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg sm:text-xl group-hover:rotate-12 transition-transform duration-500">
                  MT
                </div>
                <div>
                  <p className="font-serif text-lg sm:text-xl text-primary">Marcus Thorne</p>
                  <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-widest">Law Student, Yale</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="reveal-scale-in bg-primary p-6 sm:p-12 rounded-[1.8rem] sm:rounded-[2.5rem] shadow-2xl hover:shadow-[0_40px_60px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-4 transition-all duration-700 text-white flex flex-col justify-between group relative overflow-hidden delay-75">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-[80px] sm:text-[120px] group-hover:scale-110 transition-transform duration-1000">
                  format_quote
                </span>
              </div>
              <div className="space-y-6 sm:space-y-8 relative z-10">
                <div className="flex gap-1.5 sm:gap-2 text-[#6ffbbe]">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`material-symbols-outlined fill-1 text-xl sm:text-2xl group-hover:scale-110 transition-transform`}
                      style={{ transitionDelay: `${i * 30}ms` }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="text-base sm:text-lg italic leading-relaxed group-hover:translate-x-1 transition-transform">
                  &ldquo;The mentorship from Dr. Rodriguez gave me the confidence to pursue my PhD. Having a dedicated expert just a message away changed everything for me.&rdquo;
                </p>
              </div>
              <div className="mt-8 sm:mt-12 flex items-center gap-4 sm:gap-6 relative z-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold text-lg sm:text-xl group-hover:-rotate-12 transition-transform duration-500">
                  SJ
                </div>
                <div>
                  <p className="font-serif text-lg sm:text-xl">Sarah Jenkins</p>
                  <p className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest">Research Assistant</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="reveal-scale-in glass-card p-6 sm:p-12 rounded-[1.8rem] sm:rounded-[2.5rem] hover:shadow-[0_25px_50px_-12px_rgba(21,21,125,0.15)] hover:-translate-y-4 transition-all duration-700 group flex flex-col justify-between delay-150">
              <div className="space-y-6 sm:space-y-8">
                <div className="flex gap-1.5 sm:gap-2 text-secondary">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`material-symbols-outlined fill-1 text-xl sm:text-2xl group-hover:scale-110 transition-transform`}
                      style={{ transitionDelay: `${i * 30}ms` }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="text-base sm:text-lg italic text-on-surface leading-relaxed group-hover:translate-x-1 transition-transform">
                  &ldquo;The high-tech focus and ergonomic zones mean I can study for hours without feeling physically drained. It&apos;s a game changer for STEM students.&rdquo;
                </p>
              </div>
              <div className="mt-8 sm:mt-12 flex items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-secondary text-white flex items-center justify-center font-bold text-lg sm:text-xl group-hover:rotate-12 transition-transform duration-500">
                  LC
                </div>
                <div>
                  <p className="font-serif text-lg sm:text-xl text-primary">Leo Chen</p>
                  <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-widest">Comp Sci, MIT</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-48 px-[20px] md:px-[48px] bg-surface-container-highest relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-16 relative z-10 reveal-fade-up">
          <div className="space-y-4 sm:space-y-8">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-primary tracking-tight leading-tight">
              Ready to Elevate <br />
              <span className="text-gradient">Your Future?</span>
            </h2>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Join the next cohort of academic leaders. Experience the difference of a curated environment today. Your potential is waiting.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Link 
              href="/signup" 
              className="mouse-tilt shine-effect w-full sm:w-auto text-center px-8 py-4 sm:px-12 sm:py-6 rounded-full bg-primary text-white font-serif text-base sm:text-xl hover:bg-secondary hover:-translate-y-2 active:scale-95 transition-all duration-500 shadow-2xl shadow-primary/30 glow-active"
            >
              Apply for Membership
            </Link>
            <Link 
              href="/login" 
              className="mouse-tilt shine-effect w-full sm:w-auto text-center px-8 py-4 sm:px-12 sm:py-6 rounded-full bg-white text-primary font-serif text-base sm:text-xl border border-primary/10 hover:shadow-2xl hover:border-primary/20 hover:-translate-y-2 active:scale-95 transition-all duration-500"
            >
              Schedule a Tour
            </Link>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant opacity-50 uppercase tracking-[0.2em]">
            No credit card required for 7-day trial access
          </p>
        </div>
        <div className="bg-glow -bottom-32 -left-32 bg-purple-100/20" />
        <div className="bg-glow -top-32 -right-32 bg-blue-100/20" />
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 w-full py-12 sm:py-24 px-[20px] md:px-[48px] overflow-hidden relative">
        <div className="max-w-[1280px] mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20">
            <div className="md:col-span-4 space-y-6 sm:space-y-10">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white transition-transform group-hover:rotate-12">
                  <span className="material-symbols-outlined text-xl">school</span>
                </div>
                <div className="font-serif text-2xl text-primary font-bold">Gradee</div>
              </div>
              <p className="text-sm sm:text-base text-on-surface-variant max-w-xs leading-relaxed">
                Crafting the world&apos;s most effective academic environments through technology, mentorship, and ergonomic design.
              </p>
              <div className="flex gap-4">
                <a className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300" href="#">
                  <span className="material-symbols-outlined">share</span>
                </a>
                <a className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300" href="#">
                  <span className="material-symbols-outlined">public</span>
                </a>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-6 sm:space-y-8">
              <h6 className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Platform</h6>
              <ul className="space-y-4 sm:space-y-5">
                <li>
                  <a className="text-sm sm:text-base text-on-surface-variant hover:text-primary transition-all flex items-center gap-3 group" href="#">
                    <span className="w-0 group-hover:w-3 h-[1px] bg-primary transition-all" />
                    Study Hubs
                  </a>
                </li>
                <li>
                  <a className="text-sm sm:text-base text-on-surface-variant hover:text-primary transition-all flex items-center gap-3 group" href="#">
                    <span className="w-0 group-hover:w-3 h-[1px] bg-primary transition-all" />
                    Faculty Match
                  </a>
                </li>
                <li>
                  <a className="text-sm sm:text-base text-on-surface-variant hover:text-primary transition-all flex items-center gap-3 group" href="#">
                    <span className="w-0 group-hover:w-3 h-[1px] bg-primary transition-all" />
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="md:col-span-2 space-y-6 sm:space-y-8">
              <h6 className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Company</h6>
              <ul className="space-y-4 sm:space-y-5">
                <li>
                  <a className="text-sm sm:text-base text-on-surface-variant hover:text-primary transition-all flex items-center gap-3 group" href="#">
                    <span className="w-0 group-hover:w-3 h-[1px] bg-primary transition-all" />
                    Our Story
                  </a>
                </li>
                <li>
                  <a className="text-sm sm:text-base text-on-surface-variant hover:text-primary transition-all flex items-center gap-3 group" href="#">
                    <span className="w-0 group-hover:w-3 h-[1px] bg-primary transition-all" />
                    Careers
                  </a>
                </li>
                <li>
                  <a className="text-sm sm:text-base text-on-surface-variant hover:text-primary transition-all flex items-center gap-3 group" href="#">
                    <span className="w-0 group-hover:w-3 h-[1px] bg-primary transition-all" />
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="md:col-span-4 space-y-6 sm:space-y-8">
              <h6 className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Stay Updated</h6>
              <p className="text-sm sm:text-base text-on-surface-variant">Get the latest academic strategies and hub updates.</p>
              <form className="flex gap-3" onSubmit={(e) => e.preventDefault()}>
                <input 
                  className="flex-1 bg-surface-container-low border border-slate-100 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm" 
                  placeholder="Email address" 
                  type="email" 
                />
                <button className="bg-primary text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-secondary hover:scale-110 active:scale-95 transition-all shadow-xl shadow-primary/10">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </form>
            </div>
          </div>
          
          <div className="mt-16 sm:mt-32 pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
            <p className="text-xs font-medium text-on-surface-variant/60 text-center md:text-left">
              © 2024 Gradee Inc. Pursuing Digital Academic Excellence.
            </p>
            <div className="flex gap-6 sm:gap-10 text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant/50">
              <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="hover:text-primary transition-colors" href="#">Terms</a>
              <a className="hover:text-primary transition-colors" href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
