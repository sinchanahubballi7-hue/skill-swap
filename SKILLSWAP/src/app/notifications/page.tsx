"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Handshake, MessageCircle, Sparkles, Star, Info } from "lucide-react";
import { AppShell, PageTitle, useMe } from "@/components/app-shell";
import { Btn, EmptyState, Spinner } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
};

const ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  request: { icon: Handshake, color: "text-amber" },
  accepted: { icon: Handshake, color: "text-sky" },
  rejected: { icon: Handshake, color: "text-pink" },
  completed: { icon: CheckCheck, color: "text-mint" },
  review: { icon: Star, color: "text-lime" },
  message: { icon: MessageCircle, color: "text-violet" },
  system: { icon: Info, color: "text-muted" },
};

export default function NotificationsPage() {
  const { data: me, loading, refresh } = useMe();
  const [items, setItems] = useState<Notification[]>([]);
  const [fetching, setFetching] = useState(true);

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const d = await res.json();
      setItems(d.notifications ?? []);
    }
    setFetching(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    refresh();
  }

  useEffect(() => {
    // auto-mark read after viewing for a moment
    if (!fetching && items.some((n) => !n.read)) {
      const t = setTimeout(markAllRead, 1800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetching]);

  if (loading || !me) return <Spinner label="Loading alerts" />;

  const unread = items.filter((n) => !n.read).length;

  return (
    <AppShell me={me}>
      <PageTitle
        eyebrow="// notifications"
        title="Stay in"
        accent="the loop."
        subtitle="Requests, acceptances, messages and reviews — everything that needs your attention."
        action={
          unread > 0 ? (
            <Btn variant="secondary" size="sm" onClick={markAllRead}>
              <CheckCheck size={14} /> Mark all read
            </Btn>
          ) : undefined
        }
      />

      {fetching ? (
        <Spinner label="Fetching alerts" />
      ) : items.length === 0 ? (
        <EmptyState
          title="All quiet for now"
          body="You'll get alerts here when someone requests a swap, accepts, messages, or reviews you."
          action={<Link href="/browse"><Btn size="sm"><Sparkles size={14} /> Find a swap</Btn></Link>}
        />
      ) : (
        <div className="card divide-y divide-line">
          {items.map((n) => {
            const meta = ICONS[n.type] ?? ICONS.system;
            return (
              <Link
                key={n.id}
                href={n.href || "/notifications"}
                className={cn(
                  "flex gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]",
                  !n.read && "bg-lime/[0.04]"
                )}
              >
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5", meta.color)}>
                  <meta.icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className={cn("text-sm", !n.read ? "font-bold" : "font-semibold")}>{n.title}</p>
                    <span className="shrink-0 font-mono-alt text-[10px] uppercase tracking-widest text-muted/60">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                </div>
                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lime" />}
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
