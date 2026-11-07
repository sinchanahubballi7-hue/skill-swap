"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Repeat,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Avatar, Logo } from "@/components/ui";
import { cn } from "@/lib/utils";

export type MePayload = {
  user: {
    id: string;
    name: string;
    email: string;
    college: string;
    year: string;
    bio: string;
    avatarColor: string;
    role: string;
    ratingAvg: number | null;
    ratingCount: number;
  };
  teachSkills: { id: number; skillId: number; name: string; level: string }[];
  learnSkills: { id: number; skillId: number; name: string; level: string }[];
  unreadMessages: number;
  unreadNotifications: number;
  pendingIncoming: number;
};

export function useMe() {
  const router = useRouter();
  const [data, setData] = useState<MePayload | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      setData(await res.json());
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/browse", label: "Browse", icon: Compass },
  { href: "/requests", label: "Requests", icon: Repeat, badge: "pendingIncoming" as const },
  { href: "/messages", label: "Messages", icon: MessageCircle, badge: "unreadMessages" as const },
  { href: "/notifications", label: "Alerts", icon: Bell, badge: "unreadNotifications" as const },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, me }: { children: ReactNode; me: MePayload | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Logo href="/dashboard" />
          <nav className="no-scrollbar ml-2 flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const badge = item.badge && me ? me[item.badge] : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-white/5 text-fg" : "text-muted hover:bg-white/5 hover:text-fg"
                  )}
                >
                  <item.icon size={16} />
                  <span className="hidden sm:inline">{item.label}</span>
                  {!!badge && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1 text-[11px] font-bold text-ink">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {me?.user.role === "admin" && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-pink/15 text-pink"
                    : "text-pink/80 hover:bg-pink/10 hover:text-pink"
                )}
              >
                <ShieldCheck size={16} />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </nav>
          {me && (
            <div className="flex items-center gap-2">
              <Link href="/settings" className="hidden items-center gap-2.5 md:flex">
                <Avatar name={me.user.name} color={me.user.avatarColor} size={34} />
                <span className="max-w-[120px] truncate text-sm font-medium">{me.user.name}</span>
              </Link>
              <button
                onClick={logout}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-pink/40 hover:text-pink"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  accent,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono-alt text-[11px] uppercase tracking-[0.25em] text-lime">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {title} {accent && <span className="text-lime">{accent}</span>}
        </h1>
        {subtitle && <p className="mt-2 max-w-xl text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
