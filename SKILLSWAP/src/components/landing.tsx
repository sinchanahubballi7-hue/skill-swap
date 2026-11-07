"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  Repeat,
  MessageCircle,
  Star,
  Bell,
  ShieldCheck,
  Sparkles,
  Search,
  Handshake,
  Wallet,
  Users,
  ArrowLeftRight,
} from "lucide-react";
import { Logo, Eyebrow, Avatar } from "@/components/ui";

/* ------------------------------ motion bits ------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function Reveal({ children, i = 0, className }: { children: React.ReactNode; i?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      custom={i}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------ data ------------------------------------ */

const TICKER_SKILLS = [
  "Python", "Figma", "Guitar", "Spanish", "React", "Photography", "Chess",
  "Video Editing", "Public Speaking", "Excel", "Illustration", "Yoga",
  "Machine Learning", "Copywriting", "Calculus", "UI Design", "Data Science", "Piano",
];

const STEPS = [
  {
    no: "01",
    title: "List your skills",
    body: "Add what you can teach and what you want to learn. Python for design, guitar for calculus — anything goes.",
  },
  {
    no: "02",
    title: "Get matched",
    body: "Our matcher scans every student on campus and finds people who teach exactly what you want to learn.",
  },
  {
    no: "03",
    title: "Swap & grow",
    body: "Send a request, chat, meet up, exchange knowledge — then rate your swap and level up your profile.",
  },
];

const FEATURES = [
  {
    icon: Search,
    title: "Skill search",
    body: "Search the whole campus by skill, name or college. Find your perfect teacher in seconds.",
    span: "md:col-span-2",
    accent: "text-lime",
  },
  {
    icon: Sparkles,
    title: "Smart matching",
    body: "Match scores rank students who teach what you want — and want what you teach.",
    span: "",
    accent: "text-violet",
  },
  {
    icon: Handshake,
    title: "Swap requests",
    body: "Send, accept or decline exchange requests with a clear trail.",
    span: "",
    accent: "text-sky",
  },
  {
    icon: MessageCircle,
    title: "Built-in chat",
    body: "No more lost DMs. Coordinate every swap inside the platform.",
    span: "",
    accent: "text-pink",
  },
  {
    icon: Star,
    title: "Ratings & reviews",
    body: "Two-way feedback after every completed swap keeps quality sky-high.",
    span: "",
    accent: "text-amber",
  },
  {
    icon: ShieldCheck,
    title: "Admin dashboard",
    body: "Moderation, skill catalog and platform analytics for admins.",
    span: "md:col-span-2",
    accent: "text-mint",
  },
];

const TESTIMONIALS = [
  {
    name: "Ananya S.",
    college: "Design · Junior",
    color: "#8B7CFF",
    quote: "I traded Figma lessons for Python tutoring. Both of us now have a portfolio-ready project — and zero money changed hands.",
  },
  {
    name: "Rohan M.",
    college: "CS · Sophomore",
    color: "#4BC6FF",
    quote: "The matcher found a guitarist in my own hostel who wanted to learn React. We've been swapping sessions every Friday since.",
  },
  {
    name: "Priya K.",
    college: "Economics · Senior",
    color: "#FF6B9D",
    quote: "Ratings made it safe to try teaching strangers. My 'public speaking' swaps have a 4.9 rating and now I run a workshop club.",
  },
];

/* ------------------------------ component -------------------------------- */

export default function Landing() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    fetch("/api/me").then((r) => setLoggedIn(r.ok)).catch(() => {});
  }, []);

  return (
    <div className="relative overflow-x-clip">
      {/* ------------------------------- nav ------------------------------ */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#how" className="transition-colors hover:text-fg">How it works</a>
            <a href="#features" className="transition-colors hover:text-fg">Features</a>
            <a href="#community" className="transition-colors hover:text-fg">Community</a>
          </nav>
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 text-sm font-bold text-ink transition-shadow hover:shadow-[0_8px_30px_-8px_rgba(217,255,75,0.6)]"
              >
                Open app <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted transition-colors hover:text-fg">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 text-sm font-bold text-ink transition-shadow hover:shadow-[0_8px_30px_-8px_rgba(217,255,75,0.6)]"
                >
                  Get started <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------- hero ------------------------------ */}
      <section className="relative flex min-h-svh flex-col justify-center px-4 pb-24 pt-32 sm:px-6">
        {/* backdrop glow + grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% -5%, rgba(139,124,255,0.18), transparent 70%), radial-gradient(45% 40% at 85% 70%, rgba(217,255,75,0.07), transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(75% 60% at 50% 40%, black, transparent)",
          }}
        />

        <div className="relative mx-auto w-full max-w-7xl">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <Eyebrow>// the campus barter economy</Eyebrow>
          </motion.div>

          <div className="mt-6">
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="text-[13.5vw] font-bold leading-[0.92] tracking-[-0.03em] sm:text-[9vw] lg:text-[7.2rem]"
            >
              TEACH WHAT
            </motion.h1>
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="text-outline text-[13.5vw] font-bold leading-[0.92] tracking-[-0.03em] sm:text-[9vw] lg:text-[7.2rem]"
            >
              YOU KNOW.
            </motion.h1>
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="text-[13.5vw] font-bold leading-[0.92] tracking-[-0.03em] text-lime sm:text-[9vw] lg:text-[7.2rem]"
            >
              LEARN WHAT <span className="text-fg">YOU LOVE.</span>
            </motion.h1>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}>
              <Link
                href={loggedIn ? "/dashboard" : "/register"}
                className="group inline-flex items-center gap-3 rounded-2xl bg-lime px-7 py-4 text-base font-bold text-ink transition-all hover:shadow-[0_12px_40px_-8px_rgba(217,255,75,0.55)]"
              >
                Start swapping — it&apos;s free
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1.5" />
              </Link>
            </motion.div>
            <motion.p variants={fadeUp} initial="hidden" animate="show" custom={5} className="max-w-sm text-sm leading-relaxed text-muted">
              A skill-exchange platform for college students. Swap Python for design,
              guitar for calculus — <span className="text-fg">no money, just knowledge.</span>
            </motion.p>
          </div>

          {/* floating chips */}
          <div className="pointer-events-none absolute right-[4%] top-[8%] hidden xl:block">
            <div className="animate-float rounded-2xl border border-line bg-panel/90 px-5 py-4 backdrop-blur">
              <p className="font-mono-alt text-[10px] uppercase tracking-widest text-muted">new match</p>
              <div className="mt-2 flex items-center gap-3">
                <Avatar name="Karan T" color="#D9FF4B" size={36} />
                <div className="text-sm">
                  <p className="font-semibold">Karan teaches Python</p>
                  <p className="text-muted">wants to learn Figma</p>
                </div>
                <span className="ml-2 grid h-8 w-8 place-items-center rounded-lg bg-lime/15 text-lime">
                  <ArrowLeftRight size={14} />
                </span>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute right-[20%] top-[52%] hidden xl:block">
            <div className="animate-float rounded-2xl border border-line bg-panel/90 px-4 py-3 backdrop-blur" style={{ animationDelay: "-3s" }}>
              <div className="flex items-center gap-2 text-sm">
                <Star size={14} className="fill-lime text-lime" />
                <span className="font-semibold">4.9</span>
                <span className="text-muted">swap rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ ticker ------------------------------ */}
      <div className="relative -rotate-1 border-y-4 border-ink bg-lime py-3">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8">
            {[...TICKER_SKILLS, ...TICKER_SKILLS].map((s, i) => (
              <span key={i} className="flex items-center gap-8 whitespace-nowrap text-lg font-bold uppercase tracking-wide text-ink">
                {s} <ArrowLeftRight size={16} strokeWidth={2.5} />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------- stats ------------------------------ */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
          {[
            { n: "50+", l: "skills on campus" },
            { n: "1.2k", l: "swaps completed" },
            { n: "4.8", l: "avg. swap rating" },
            { n: "₹0", l: "spent on learning" },
          ].map((s, i) => (
            <Reveal key={s.l} i={i} className="px-6 py-10 text-center md:py-14">
              <p className="text-4xl font-bold tracking-tight text-lime md:text-5xl">{s.n}</p>
              <p className="mt-2 font-mono-alt text-[11px] uppercase tracking-[0.2em] text-muted">{s.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------- how it works --------------------------- */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-28 sm:px-6">
        <Reveal>
          <Eyebrow>// how it works</Eyebrow>
          <h2 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Three steps. <span className="text-outline">Zero rupees.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.no} i={i}>
              <div className="card group relative h-full overflow-hidden p-8 transition-colors duration-300 hover:border-lime/40">
                <span className="text-outline-lime text-7xl font-bold tracking-tight opacity-70 transition-opacity group-hover:opacity-100">
                  {s.no}
                </span>
                <h3 className="mt-6 text-2xl font-bold">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-lime/5 blur-2xl transition-all duration-500 group-hover:bg-lime/15" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ----------------------------- features ----------------------------- */}
      <section id="features" className="border-y border-line bg-panel/40">
        <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6">
          <Reveal>
            <Eyebrow>// everything included</Eyebrow>
            <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              One platform. <span className="text-lime">Every tool you need.</span>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} i={i % 3} className={f.span}>
                <div className="card group h-full p-8 transition-all duration-300 hover:-translate-y-1 hover:border-fg/20">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl bg-white/5 ${f.accent}`}>
                    <f.icon size={20} />
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{f.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- community ----------------------------- */}
      <section id="community" className="mx-auto max-w-7xl px-4 py-28 sm:px-6">
        <Reveal>
          <Eyebrow>// from the community</Eyebrow>
          <h2 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Students teaching <span className="text-outline">students.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} i={i}>
              <figure className="card flex h-full flex-col justify-between p-8">
                <blockquote className="text-[15px] leading-relaxed text-fg/90">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-3">
                  <Avatar name={t.name} color={t.color} size={40} />
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted">{t.college}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------- cta -------------------------------- */}
      <section className="relative border-t border-line">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(50% 60% at 50% 100%, rgba(217,255,75,0.12), transparent 70%)" }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-32 text-center sm:px-6">
          <Reveal>
            <GraduationCap size={40} className="text-lime" />
            <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Your campus is full of teachers.
              <br />
              <span className="text-lime">Meet them.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-muted">
              Join SkillSwap today. Teach one skill, learn another, and build the most collaborative campus community.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-3 rounded-2xl bg-lime px-8 py-4 text-base font-bold text-ink transition-all hover:shadow-[0_12px_40px_-8px_rgba(217,255,75,0.55)]"
              >
                Create free account
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1.5" />
              </Link>
              <span className="flex items-center gap-2 font-mono-alt text-xs uppercase tracking-widest text-muted">
                <Wallet size={14} /> Free forever for students
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------- footer ------------------------------ */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-10 sm:px-6">
          <Logo />
          <p className="font-mono-alt text-[11px] uppercase tracking-[0.2em] text-muted">
            Trade skills. Not cash. © {new Date().getFullYear()} SkillSwap
          </p>
          <div className="flex items-center gap-2 text-muted">
            <Bell size={14} />
            <Users size={14} />
            <Repeat size={14} />
          </div>
        </div>
      </footer>
    </div>
  );
}
