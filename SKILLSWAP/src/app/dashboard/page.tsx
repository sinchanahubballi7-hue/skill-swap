"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  Handshake,
  MessageCircle,
  Repeat,
  Sparkles,
} from "lucide-react";
import { AppShell, PageTitle, useMe } from "@/components/app-shell";
import { Avatar, EmptyState, SkillChip, Spinner, StatusPill, Btn } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

type DashboardData = {
  stats: {
    teachCount: number;
    learnCount: number;
    activeSwaps: number;
    completedSwaps: number;
    pendingIncoming: number;
    unreadMessages: number;
    unreadNotifications: number;
  };
  recentNotifications: { id: number; title: string; body: string; createdAt: string; href: string }[];
  recentSwaps: {
    id: string;
    status: string;
    senderId: string;
    createdAt: string;
    teachSkill: { name: string } | null;
    learnSkill: { name: string } | null;
  }[];
};

type MatchUser = {
  id: string;
  name: string;
  college: string;
  avatarColor: string;
  matchScore: number;
  teachesWhatIWant: { name: string }[];
  wantsWhatITeach: { name: string }[];
  ratingAvg: number | null;
};

export default function DashboardPage() {
  const { data: me, loading } = useMe();
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [matches, setMatches] = useState<MatchUser[]>([]);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setDash).catch(() => {});
    fetch("/api/users?match=1&limit=4")
      .then((r) => r.json())
      .then((d) => setMatches(d.users ?? []))
      .catch(() => {});
  }, []);

  if (loading || !me) return <Spinner label="Opening your campus" />;

  const statCards = [
    { label: "Active swaps", value: dash?.stats.activeSwaps ?? 0, icon: Handshake, color: "text-sky", href: "/requests" },
    { label: "Swaps completed", value: dash?.stats.completedSwaps ?? 0, icon: CheckCircle2, color: "text-mint", href: "/requests" },
    { label: "Unread messages", value: dash?.stats.unreadMessages ?? 0, icon: MessageCircle, color: "text-pink", href: "/messages" },
    { label: "New alerts", value: dash?.stats.unreadNotifications ?? 0, icon: Bell, color: "text-amber", href: "/notifications" },
  ];

  const hasNoSkills = me.teachSkills.length === 0 && me.learnSkills.length === 0;

  return (
    <AppShell me={me}>
      <PageTitle
        eyebrow={`// ${new Date().getHours() < 12 ? "good morning" : new Date().getHours() < 18 ? "good afternoon" : "good evening"}`}
        title={`Hey, ${me.user.name.split(" ")[0]}.`}
        accent="Ready to swap?"
        subtitle="Your campus skill-exchange command center."
        action={
          <Link href="/browse">
            <Btn>
              <Compass size={16} /> Find skills
            </Btn>
          </Link>
        }
      />

      {hasNoSkills && (
        <div className="card mb-8 flex flex-wrap items-center justify-between gap-4 border-lime/30 bg-gradient-to-r from-lime/10 to-transparent p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime/15 text-lime">
              <Sparkles size={20} />
            </span>
            <div>
              <h3 className="font-bold">Set up your swap profile</h3>
              <p className="mt-1 max-w-lg text-sm text-muted">
                Add skills you can teach and skills you want to learn — our matcher will instantly
                find students to trade with.
              </p>
            </div>
          </div>
          <Link href="/settings">
            <Btn size="sm">Add skills <ArrowRight size={14} /></Btn>
          </Link>
        </div>
      )}

      {/* my skill inventory */}
      {!hasNoSkills && (
        <div className="card mb-8 grid gap-6 p-6 md:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 font-mono-alt text-[11px] uppercase tracking-widest text-lime">
              <GraduationCap size={14} /> I teach ({dash?.stats.teachCount ?? 0})
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {me.teachSkills.slice(0, 8).map((s) => (
                <SkillChip key={s.id} name={s.name} type="teach" level={s.level} />
              ))}
            </div>
          </div>
          <div>
            <p className="flex items-center gap-2 font-mono-alt text-[11px] uppercase tracking-widest text-violet">
              <BookOpen size={14} /> I want to learn ({dash?.stats.learnCount ?? 0})
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {me.learnSkills.slice(0, 8).map((s) => (
                <SkillChip key={s.id} name={s.name} type="learn" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} className="card group p-5 transition-all hover:-translate-y-1 hover:border-fg/20">
            <div className="flex items-center justify-between">
              <s.icon size={20} className={s.color} />
              <span className="text-3xl font-bold tracking-tight">{s.value}</span>
            </div>
            <p className="mt-3 font-mono-alt text-[11px] uppercase tracking-widest text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        {/* matches */}
        <section className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Sparkles size={18} className="text-lime" /> Top matches for you
            </h2>
            <Link href="/browse" className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-lime">
              See all <ArrowRight size={14} />
            </Link>
          </div>
          {matches.length === 0 ? (
            <EmptyState
              title="No matches yet"
              body="Add skills you want to learn in Settings, and we'll surface students who teach them."
              action={<Link href="/settings"><Btn size="sm">Set learning goals</Btn></Link>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {matches.map((m) => (
                <Link key={m.id} href={`/users/${m.id}`} className="card group p-5 transition-all hover:-translate-y-1 hover:border-lime/40">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} color={m.avatarColor} size={44} />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{m.name}</p>
                      <p className="truncate text-xs text-muted">{m.college}</p>
                    </div>
                    {m.matchScore >= 3 && (
                      <span className="ml-auto rounded-full bg-lime/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime">
                        2-way
                      </span>
                    )}
                  </div>
                  <div className="mt-4 space-y-1.5 text-xs">
                    <p className="text-muted">
                      Teaches you: <span className="font-semibold text-lime">{m.teachesWhatIWant.map((s) => s.name).join(", ") || "—"}</span>
                    </p>
                    {m.wantsWhatITeach.length > 0 && (
                      <p className="text-muted">
                        Wants your: <span className="font-semibold text-violet">{m.wantsWhatITeach.map((s) => s.name).join(", ")}</span>
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* activity */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Bell size={18} className="text-amber" /> Recent activity
            </h2>
            <Link href="/notifications" className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-lime">
              All alerts <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card divide-y divide-line">
            {dash && dash.recentNotifications.length > 0 ? (
              dash.recentNotifications.map((n) => (
                <Link key={n.id} href={n.href || "/notifications"} className="block px-5 py-4 transition-colors hover:bg-white/[0.03]">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p>
                  <p className="mt-1 font-mono-alt text-[10px] uppercase tracking-widest text-muted/60">{timeAgo(n.createdAt)}</p>
                </Link>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted">Nothing yet — your swaps will show up here.</p>
            )}
          </div>

          {dash && dash.recentSwaps.length > 0 && (
            <>
              <h2 className="mb-4 mt-8 flex items-center gap-2 text-lg font-bold">
                <Repeat size={18} className="text-sky" /> Latest swaps
              </h2>
              <div className="card divide-y divide-line">
                {dash.recentSwaps.map((r) => (
                  <Link key={r.id} href="/requests" className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-white/[0.03]">
                    <div className="min-w-0 text-sm">
                      <p className="truncate font-medium">
                        {r.teachSkill?.name ?? "Skill"} ⇄ {r.learnSkill?.name ?? "Skill"}
                      </p>
                      <p className="font-mono-alt text-[10px] uppercase tracking-widest text-muted/60">{timeAgo(r.createdAt)}</p>
                    </div>
                    <StatusPill status={r.status} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
