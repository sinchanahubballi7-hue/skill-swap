"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Compass, Search, Sparkles, Star, X } from "lucide-react";
import { AppShell, PageTitle, useMe } from "@/components/app-shell";
import { Avatar, Btn, EmptyState, SkillChip, Spinner } from "@/components/ui";

type BrowseUser = {
  id: string;
  name: string;
  college: string;
  year: string;
  bio: string;
  avatarColor: string;
  teachSkills: { skillId: number; name: string; level: string }[];
  learnSkills: { skillId: number; name: string }[];
  matchScore: number;
  teachesWhatIWant: { name: string }[];
  wantsWhatITeach: { name: string }[];
  ratingAvg: number | null;
  ratingCount: number;
};

export default function BrowsePage() {
  const { data: me, loading } = useMe();
  const [users, setUsers] = useState<BrowseUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const [matchOnly, setMatchOnly] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function search(query: string, sk: string, match: boolean) {
    setFetching(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sk) params.set("skill", sk);
    if (match) params.set("match", "1");
    try {
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      setUsers(data.users ?? []);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    search("", "", false);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(q, skill, matchOnly), 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, skill, matchOnly]);

  if (loading || !me) return <Spinner label="Scanning campus" />;

  return (
    <AppShell me={me}>
      <PageTitle
        eyebrow="// skill search"
        title="Find your"
        accent="teacher."
        subtitle="Search students on campus by name, college, or the skill they teach. Matches who teach what you want are ranked first."
      />

      {/* search bar */}
      <div className="card mb-8 flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="field pl-10"
            placeholder="Search people or colleges…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="relative flex-1">
          <Compass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="field pl-10"
            placeholder="Filter by skill — e.g. Python, Guitar…"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
          />
          {skill && (
            <button
              onClick={() => setSkill("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
              aria-label="Clear skill filter"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <Btn
          variant={matchOnly ? "primary" : "secondary"}
          onClick={() => setMatchOnly((v) => !v)}
          className="shrink-0"
        >
          <Sparkles size={16} /> {matchOnly ? "Matches only: on" : "Matches only"}
        </Btn>
      </div>

      {fetching ? (
        <Spinner label="Searching" />
      ) : users.length === 0 ? (
        <EmptyState
          title="No students found"
          body="Try a different search, or add learning goals in Settings so the matcher can work for you."
          action={<Link href="/settings"><Btn size="sm">Update my skills</Btn></Link>}
        />
      ) : (
        <>
          <p className="mb-4 font-mono-alt text-[11px] uppercase tracking-widest text-muted">
            {users.length} student{users.length === 1 ? "" : "s"} found
            {matchOnly ? " · match view" : ""}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/users/${u.id}`}
                className="card group relative flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:border-lime/40 hover:shadow-[0_20px_50px_-20px_rgba(217,255,75,0.15)]"
              >
                {u.matchScore >= 3 && (
                  <span className="absolute -right-2 -top-2 rotate-6 rounded-lg bg-lime px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-lg">
                    Perfect swap
                  </span>
                )}
                {u.matchScore > 0 && u.matchScore < 3 && (
                  <span className="absolute -right-2 -top-2 rotate-6 rounded-lg bg-violet px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-lg">
                    Match
                  </span>
                )}
                <div className="flex items-center gap-3.5">
                  <Avatar name={u.name} color={u.avatarColor} size={52} />
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold">{u.name}</p>
                    <p className="truncate text-xs text-muted">
                      {u.college}
                      {u.year ? ` · ${u.year}` : ""}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <Star size={11} className={u.ratingAvg ? "fill-lime text-lime" : "text-muted/40"} />
                      {u.ratingAvg ? `${u.ratingAvg} (${u.ratingCount})` : "New swapper"}
                    </p>
                  </div>
                </div>

                {u.bio && <p className="mt-4 line-clamp-2 text-sm text-muted">{u.bio}</p>}

                <div className="mt-4 flex-1">
                  <p className="font-mono-alt text-[10px] uppercase tracking-widest text-lime">teaches</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {u.teachSkills.slice(0, 4).map((s) => (
                      <SkillChip key={s.skillId} name={s.name} type="teach" />
                    ))}
                    {u.teachSkills.length > 4 && (
                      <span className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted">
                        +{u.teachSkills.length - 4}
                      </span>
                    )}
                    {u.teachSkills.length === 0 && <span className="text-xs text-muted">—</span>}
                  </div>
                </div>

                {u.teachesWhatIWant.length > 0 && (
                  <p className="mt-4 rounded-lg bg-lime/10 px-3 py-2 text-xs text-lime">
                    <Sparkles size={12} className="mr-1 inline" />
                    Teaches what you want: {u.teachesWhatIWant.map((s) => s.name).join(", ")}
                  </p>
                )}

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors group-hover:text-lime">
                  View profile <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
