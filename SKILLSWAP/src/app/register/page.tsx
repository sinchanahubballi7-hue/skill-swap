"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Btn, Logo } from "@/components/ui";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate", "PhD"];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", college: "", year: YEARS[0] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        setLoading(false);
        return;
      }
      router.push("/settings?welcome=1");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* form */}
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden">
            <Logo />
          </div>
          <h2 className="mt-10 text-3xl font-bold tracking-tight">Create your account</h2>
          <p className="mt-2 text-sm text-muted">
            Already swapping?{" "}
            <Link href="/login" className="font-semibold text-lime hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">
                Full name
              </label>
              <input
                className="field"
                placeholder="Aisha Verma"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">
                Email
              </label>
              <input
                className="field"
                type="email"
                placeholder="you@college.edu"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">
                  College
                </label>
                <input
                  className="field"
                  placeholder="IIT Bombay"
                  value={form.college}
                  onChange={(e) => set("college", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">
                  Year
                </label>
                <select className="field" value={form.year} onChange={(e) => set("year", e.target.value)}>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">
                Password
              </label>
              <input
                className="field"
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-pink/30 bg-pink/10 px-4 py-2.5 text-sm text-pink">{error}</p>
            )}

            <Btn type="submit" size="lg" className="w-full" disabled={loading}>
              <Sparkles size={18} />
              {loading ? "Creating account…" : "Join SkillSwap free"}
            </Btn>
          </form>

          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg">
            <ArrowRight size={14} className="rotate-180" /> Back to home
          </Link>
        </motion.div>
      </div>

      {/* right panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-l border-line p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(70% 60% at 80% 90%, rgba(217,255,75,0.14), transparent 70%)" }}
        />
        <Logo />
        <div className="relative">
          <p className="font-mono-alt text-[11px] uppercase tracking-[0.25em] text-lime">// join the swap</p>
          <h1 className="mt-4 text-6xl font-bold leading-[0.95] tracking-tight">
            Everyone
            <br />
            knows <span className="text-outline">something</span>
            <br />
            you don&apos;t.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
            Set up takes 60 seconds. Add two skills you teach and two you want to learn,
            and the matcher gets to work immediately.
          </p>
        </div>
        <p className="relative font-mono-alt text-[11px] uppercase tracking-[0.2em] text-muted">
          1,200+ swaps and counting
        </p>
      </div>
    </div>
  );
}
