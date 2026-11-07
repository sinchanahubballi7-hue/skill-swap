"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Ban,
  CheckCircle2,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  MessageCircle,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { AppShell, PageTitle, useMe } from "@/components/app-shell";
import { Avatar, Btn, EmptyState, Spinner, StatusPill } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

type AdminStats = {
  stats: {
    users: number;
    skills: number;
    requests: number;
    pending: number;
    completed: number;
    messages: number;
    reviews: number;
    banned: number;
  };
  recentRequests: {
    id: string;
    status: string;
    createdAt: string;
    sender: { name: string } | null;
    receiver: { name: string } | null;
    learnSkill: { name: string } | null;
    teachSkill: { name: string } | null;
  }[];
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  college: string;
  avatarColor: string;
  role: string;
  banned: boolean;
  createdAt: string;
  skillCount: number;
};

type AdminSkill = {
  id: number;
  name: string;
  category: string;
  teachCount: number;
  learnCount: number;
};

const CATEGORIES = ["Programming", "Design", "Music", "Languages", "Marketing", "Data", "Business", "Science", "Writing", "Photography", "Sports", "Lifestyle", "General"];

export default function AdminPage() {
  const { data: me, loading } = useMe();
  const [tab, setTab] = useState<"overview" | "users" | "skills">("overview");
  const [overview, setOverview] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [skillsList, setSkillsList] = useState<AdminSkill[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newCategory, setNewCategory] = useState("General");

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.status === 403) return setForbidden(true);
    if (res.ok) setOverview(await res.json());
  }, []);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers((await res.json()).users);
  }, []);

  const loadSkills = useCallback(async () => {
    const res = await fetch("/api/admin/skills");
    if (res.ok) setSkillsList((await res.json()).skills);
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (tab === "users" && !users) loadUsers();
    if (tab === "skills" && !skillsList) loadSkills();
  }, [tab, users, skillsList, loadUsers, loadSkills]);

  async function patchUser(id: string, patch: Record<string, unknown>) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    loadUsers();
    loadOverview();
  }

  async function deleteUser(id: string) {
    if (!confirm("Permanently delete this user and all their data?")) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadUsers();
    loadOverview();
  }

  async function addSkill() {
    if (!newSkill.trim()) return;
    await fetch("/api/admin/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSkill.trim(), category: newCategory }),
    });
    setNewSkill("");
    loadSkills();
    loadOverview();
  }

  async function deleteSkill(id: number) {
    await fetch("/api/admin/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadSkills();
    loadOverview();
  }

  if (loading || !me) return <Spinner label="Loading admin" />;

  if (forbidden || me.user.role !== "admin") {
    return (
      <AppShell me={me}>
        <EmptyState
          title="Admins only"
          body="This dashboard is reserved for platform administrators. Log in with an admin account to access it."
        />
      </AppShell>
    );
  }

  const statCards = overview
    ? [
        { label: "Total users", value: overview.stats.users, icon: Users, color: "text-lime" },
        { label: "Skills listed", value: overview.stats.skills, icon: GraduationCap, color: "text-violet" },
        { label: "Swap requests", value: overview.stats.requests, icon: Handshake, color: "text-sky" },
        { label: "Pending", value: overview.stats.pending, icon: Activity, color: "text-amber" },
        { label: "Completed swaps", value: overview.stats.completed, icon: CheckCircle2, color: "text-mint" },
        { label: "Messages sent", value: overview.stats.messages, icon: MessageCircle, color: "text-pink" },
        { label: "Reviews", value: overview.stats.reviews, icon: Star, color: "text-lime" },
        { label: "Suspended users", value: overview.stats.banned, icon: Ban, color: "text-pink" },
      ]
    : [];

  return (
    <AppShell me={me}>
      <PageTitle
        eyebrow="// admin dashboard"
        title="Platform"
        accent="control."
        subtitle="Manage users, moderate the skill catalog, and monitor activity across SkillSwap."
      />

      <div className="mb-6 flex gap-2">
        {(
          [
            { key: "overview", label: "Overview", icon: LayoutDashboard },
            { key: "users", label: "Users", icon: Users },
            { key: "skills", label: "Skills", icon: GraduationCap },
          ] as const
        ).map((t) => (
          <Btn key={t.key} variant={tab === t.key ? "primary" : "secondary"} onClick={() => setTab(t.key)}>
            <t.icon size={15} /> {t.label}
          </Btn>
        ))}
      </div>

      {/* ------------------------------ overview ------------------------------ */}
      {tab === "overview" && (
        <>
          {!overview ? (
            <Spinner label="Computing stats" />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((s) => (
                  <div key={s.label} className="card p-5">
                    <div className="flex items-center justify-between">
                      <s.icon size={20} className={s.color} />
                      <span className="text-3xl font-bold tracking-tight">{s.value}</span>
                    </div>
                    <p className="mt-3 font-mono-alt text-[11px] uppercase tracking-widest text-muted">{s.label}</p>
                  </div>
                ))}
              </div>

              <h2 className="mt-10 text-lg font-bold">Latest swap requests</h2>
              <div className="card mt-4 divide-y divide-line">
                {overview.recentRequests.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-muted">No activity yet.</p>
                )}
                {overview.recentRequests.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="text-sm">
                      <span className="font-semibold">{r.sender?.name}</span>
                      <span className="text-muted"> → </span>
                      <span className="font-semibold">{r.receiver?.name}</span>
                      <span className="ml-2 text-muted">
                        ({r.learnSkill?.name ?? "skill"} ⇄ {r.teachSkill?.name ?? "—"})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-alt text-[10px] uppercase tracking-widest text-muted/60">
                        {timeAgo(r.createdAt)}
                      </span>
                      <StatusPill status={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ------------------------------- users ------------------------------- */}
      {tab === "users" && (
        <>
          {!users ? (
            <Spinner label="Loading users" />
          ) : (
            <div className="card divide-y divide-line">
              {users.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <Avatar name={u.name} color={u.avatarColor} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                      {u.name}
                      {u.role === "admin" && (
                        <span className="flex items-center gap-1 rounded-full bg-pink/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink">
                          <ShieldCheck size={10} /> admin
                        </span>
                      )}
                      {u.banned && (
                        <span className="rounded-full bg-pink/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink">
                          suspended
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {u.email} · {u.college || "no college"} · {u.skillCount} skills · joined {timeAgo(u.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.role !== "admin" && (
                      <Btn size="sm" variant="ghost" onClick={() => patchUser(u.id, { role: "admin" })} title="Promote to admin">
                        <ShieldAlert size={14} /> Make admin
                      </Btn>
                    )}
                    {u.id !== me.user.id && u.role === "admin" && (
                      <Btn size="sm" variant="ghost" onClick={() => patchUser(u.id, { role: "student" })}>
                        Demote
                      </Btn>
                    )}
                    {u.id !== me.user.id && (
                      <>
                        <Btn
                          size="sm"
                          variant={u.banned ? "success" : "secondary"}
                          onClick={() => patchUser(u.id, { banned: !u.banned })}
                        >
                          <Ban size={14} /> {u.banned ? "Unban" : "Suspend"}
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => deleteUser(u.id)}>
                          <Trash2 size={14} />
                        </Btn>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ------------------------------- skills ------------------------------ */}
      {tab === "skills" && (
        <>
          {!skillsList ? (
            <Spinner label="Loading skills" />
          ) : (
            <>
              <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row">
                <input
                  className="field flex-1"
                  placeholder="Add a new skill to the catalog…"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                />
                <select className="field sm:w-48" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <Btn onClick={addSkill}>
                  <Plus size={16} /> Add skill
                </Btn>
              </div>
              <div className="card divide-y divide-line">
                {skillsList.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <p className="min-w-0 flex-1 text-sm font-semibold">
                      {s.name}
                      <span className="ml-2 font-mono-alt text-[10px] uppercase tracking-widest text-muted">{s.category}</span>
                    </p>
                    <p className="text-xs text-muted">
                      <span className="text-lime">{s.teachCount} teaching</span> ·{" "}
                      <span className="text-violet">{s.learnCount} learning</span>
                    </p>
                    <Btn size="sm" variant="ghost" onClick={() => deleteSkill(s.id)} aria-label={`Delete ${s.name}`}>
                      <Trash2 size={14} className="text-pink" />
                    </Btn>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
