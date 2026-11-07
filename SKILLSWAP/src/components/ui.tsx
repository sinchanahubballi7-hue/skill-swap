"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftRight, Star, SearchX } from "lucide-react";
import { cn, initials } from "@/lib/utils";

/* -------------------------------- Logo --------------------------------- */

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg transition-transform duration-300 group-hover:rotate-180",
          light ? "bg-fg text-ink" : "bg-lime text-ink"
        )}
      >
        <ArrowLeftRight size={18} strokeWidth={2.5} />
      </span>
      <span className="text-lg font-bold tracking-tight">
        Skill<span className={light ? "text-lime" : "text-lime"}>Swap</span>
      </span>
    </Link>
  );
}

/* ------------------------------- Avatar -------------------------------- */

export function Avatar({
  name,
  color,
  size = 40,
  className,
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-bold text-ink", className)}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </span>
  );
}

/* ------------------------------- Stars --------------------------------- */

export function Stars({
  value,
  size = 14,
  interactive = false,
  onChange,
}: {
  value: number;
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(i)}
          className={cn(interactive && "cursor-pointer transition-transform hover:scale-125", !interactive && "cursor-default")}
          aria-label={`${i} star`}
        >
          <Star
            size={size}
            className={i <= Math.round(value) ? "fill-lime text-lime" : "text-muted/40"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </span>
  );
}

/* ----------------------------- Skill chip ------------------------------- */

const CHIP_TINTS: Record<string, string> = {
  teach: "border-lime/30 bg-lime/10 text-lime",
  learn: "border-violet/40 bg-violet/10 text-violet",
};

export function SkillChip({
  name,
  type = "teach",
  level,
  onRemove,
}: {
  name: string;
  type?: "teach" | "learn";
  level?: string;
  onRemove?: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        CHIP_TINTS[type]
      )}
    >
      {name}
      {level && <span className="opacity-50">· {level}</span>}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 rounded-full px-1 text-sm leading-none opacity-60 transition-opacity hover:opacity-100"
          aria-label={`Remove ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

/* ------------------------------ Status pill ------------------------------ */

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber/40 bg-amber/10 text-amber",
  accepted: "border-sky/40 bg-sky/10 text-sky",
  rejected: "border-pink/40 bg-pink/10 text-pink",
  completed: "border-mint/40 bg-mint/10 text-mint",
  cancelled: "border-muted/30 bg-muted/10 text-muted",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        STATUS_STYLES[status] ?? STATUS_STYLES.pending
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "pending" && "animate-pulse-dot", "bg-current")} />
      {status}
    </span>
  );
}

/* ------------------------------- Buttons --------------------------------- */

export function Btn({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary:
      "bg-lime text-ink hover:bg-[#c8f033] shadow-[0_0_0_0_rgba(217,255,75,0)] hover:shadow-[0_8px_30px_-8px_rgba(217,255,75,0.5)]",
    secondary: "bg-panel2 text-fg border border-line hover:border-fg/30",
    ghost: "text-muted hover:text-fg hover:bg-white/5",
    danger: "bg-pink/15 text-pink border border-pink/30 hover:bg-pink/25",
    success: "bg-mint/15 text-mint border border-mint/30 hover:bg-mint/25",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------- Spinner -------------------------------- */

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-lime" />
      <p className="font-mono-alt text-xs uppercase tracking-widest text-muted">{label}…</p>
    </div>
  );
}

/* ------------------------------ Empty state ------------------------------ */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-4 px-8 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-panel2 text-muted">
        <SearchX size={26} />
      </span>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------- Eyebrow -------------------------------- */

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono-alt text-[11px] uppercase tracking-[0.25em] text-lime">
      {children}
    </p>
  );
}
