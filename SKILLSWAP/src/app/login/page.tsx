"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, LogIn } from "lucide-react";
import { Btn, Logo } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* left panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-line p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(70% 60% at 20% 10%, rgba(139,124,255,0.2), transparent 70%)" }}
        />
        <Logo />
        <div className="relative">
          <p className="font-mono-alt text-[11px] uppercase tracking-[0.25em] text-lime">// welcome back</p>
          <h1 className="mt-4 text-6xl font-bold leading-[0.95] tracking-tight">
            Your next
            <br />
            skill is <span className="text-lime">one swap</span>
            <br />
            away.
          </h1>
        </div>
        <p className="relative font-mono-alt text-[11px] uppercase tracking-[0.2em] text-muted">
          Trade skills. Not cash.
        </p>
      </div>

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
          <h2 className="mt-10 text-3xl font-bold tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm text-muted">
            New here?{" "}
            <Link href="/register" className="font-semibold text-lime hover:underline">
              Create an account
            </Link>
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">
                Email
              </label>
              <input
                className="field"
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">
                Password
              </label>
              <input
                className="field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="rounded-lg border border-pink/30 bg-pink/10 px-4 py-2.5 text-sm text-pink">{error}</p>
            )}

            <Btn type="submit" size="lg" className="w-full" disabled={loading}>
              <LogIn size={18} />
              {loading ? "Signing in…" : "Sign in"}
            </Btn>
          </form>

          <div className="mt-8 rounded-xl border border-line bg-panel/60 p-4 text-xs text-muted">
            <p className="font-mono-alt uppercase tracking-widest text-muted">demo accounts</p>
            <p className="mt-2">aisha@campus.edu / password123 <span className="text-muted/60">(student)</span></p>
            <p>admin@skillswap.edu / admin123 <span className="text-muted/60">(admin)</span></p>
          </div>

          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg">
            <ArrowRight size={14} className="rotate-180" /> Back to home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
