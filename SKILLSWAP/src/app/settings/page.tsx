"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Check, GraduationCap, Plus, Save, Sparkles } from "lucide-react";
import { AppShell, PageTitle, useMe } from "@/components/app-shell";
import { Avatar, Btn, SkillChip, Spinner, Stars } from "@/components/ui";
import { AVATAR_COLORS, cn } from "@/lib/utils";

type CatalogSkill = { id: number; name: string; category: string };

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

function SkillPicker({
  type,
  existingIds,
  onAdded,
}: {
  type: "teach" | "learn";
  existingIds: Set<number>;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [options, setOptions] = useState<CatalogSkill[]>([]);
  const [adding, setAdding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d) => setOptions(d.skills ?? []))
      .catch(() => {});
  }, []);

  const filtered = options
    .filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    .filter((o) => !existingIds.has(o.id))
    .slice(0, 8);

  async function add(skillId: number | null, name?: string) {
    setAdding(true);
    await fetch("/api/me/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(skillId ? { skillId, type, level } : { name, type, level }),
    });
    setAdding(false);
    setQuery("");
    onAdded();
  }

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="field flex-1"
          onFocus={() => timer.current && clearTimeout(timer.current)}
          placeholder={type === "teach" ? "Add a skill you can teach… e.g. Python" : "Add something you want to learn… e.g. Guitar"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {type === "teach" && (
          <select className="field sm:w-44" value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        )}
        {query.trim() && filtered.length === 0 && (
          <Btn disabled={adding} onClick={() => add(null, query.trim())} className="shrink-0">
            <Plus size={15} /> Create “{query.trim()}”
          </Btn>
        )}
      </div>
      {query.trim() && filtered.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              disabled={adding}
              onClick={() => add(o.id)}
              className="rounded-full border border-line bg-panel2 px-3 py-1.5 text-xs text-fg transition-colors hover:border-lime/50 hover:text-lime"
            >
              + {o.name} <span className="text-muted">· {o.category}</span>
            </button>
          ))}
        </div>
      )}
      {query.trim() && filtered.length > 0 && (
        <button
          disabled={adding}
          onClick={() => add(null, query.trim())}
          className="mt-2 text-xs text-muted underline-offset-2 hover:text-lime hover:underline"
        >
          or add “{query.trim()}” as a brand-new skill
        </button>
      )}
    </div>
  );
}

function SettingsInner() {
  const { data: me, loading, refresh } = useMe();
  const params = useSearchParams();
  const welcome = params.get("welcome") === "1";

  const [form, setForm] = useState({ name: "", college: "", year: "", bio: "", avatarColor: "#D9FF4B" });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setForm({
        name: me.user.name,
        college: me.user.college,
        year: me.user.year,
        bio: me.user.bio,
        avatarColor: me.user.avatarColor,
      });
    }
  }, [me]);

  if (loading || !me) return <Spinner label="Loading settings" />;

  async function saveProfile() {
    setSaving(true);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  async function removeSkill(id: number) {
    await fetch("/api/me/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    refresh();
  }

  const teachIds = new Set(me.teachSkills.map((s) => s.skillId));
  const learnIds = new Set(me.learnSkills.map((s) => s.skillId));

  return (
    <AppShell me={me}>
      <PageTitle
        eyebrow={welcome ? "// welcome aboard" : "// profile management"}
        title={welcome ? "Let's set up" : "Your"}
        accent={welcome ? "your profile." : "profile."}
        subtitle={
          welcome
            ? "Add a few skills below — the matcher needs at least one teachable and one learnable skill to shine."
            : "Manage your personal details and the skills you teach and learn."
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* profile details */}
        <div className="card h-fit p-7">
          <h2 className="text-lg font-bold">Personal details</h2>

          <div className="mt-5 flex items-center gap-4">
            <Avatar name={form.name || "?"} color={form.avatarColor} size={64} />
            <div>
              <p className="font-mono-alt text-[10px] uppercase tracking-widest text-muted">avatar color</p>
              <div className="mt-2 flex gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, avatarColor: c }))}
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full transition-transform hover:scale-110",
                      form.avatarColor === c && "ring-2 ring-fg ring-offset-2 ring-offset-ink"
                    )}
                    style={{ background: c }}
                    aria-label={`Color ${c}`}
                  >
                    {form.avatarColor === c && <Check size={13} className="text-ink" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">Name</label>
              <input className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">College</label>
                <input className="field" value={form.college} onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">Year</label>
                <input className="field" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">
                Bio <span className="normal-case text-muted/50">({form.bio.length}/400)</span>
              </label>
              <textarea
                className="field min-h-28"
                placeholder="CS junior who loves open source, chess, and too much filter coffee…"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                maxLength={400}
              />
            </div>
            <div className="flex items-center gap-3">
              <Btn onClick={saveProfile} disabled={saving}>
                <Save size={15} /> {saving ? "Saving…" : "Save profile"}
              </Btn>
              {saved && <span className="flex items-center gap-1.5 text-sm text-mint"><Check size={15} /> Saved</span>}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-panel2 px-4 py-3 text-xs text-muted">
              <Stars value={me.user.ratingAvg ?? 0} size={13} />
              {me.user.ratingAvg !== null
                ? `Your rating: ${me.user.ratingAvg} from ${me.user.ratingCount} review${me.user.ratingCount === 1 ? "" : "s"}`
                : "No ratings yet — complete a swap to get your first review."}
            </div>
          </div>
        </div>

        {/* skills */}
        <div className="space-y-6">
          <div className="card p-7">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <GraduationCap size={18} className="text-lime" /> Skills I teach
            </h2>
            <p className="mt-1 text-sm text-muted">Things you could confidently teach another student.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {me.teachSkills.length === 0 && <p className="text-sm text-muted/70">Nothing here yet — add your first teachable skill below.</p>}
              {me.teachSkills.map((s) => (
                <SkillChip key={s.id} name={s.name} type="teach" level={s.level} onRemove={() => removeSkill(s.id)} />
              ))}
            </div>
            <SkillPicker type="teach" existingIds={teachIds} onAdded={refresh} />
          </div>

          <div className="card p-7">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <BookOpen size={18} className="text-violet" /> Skills I want to learn
            </h2>
            <p className="mt-1 text-sm text-muted">Your learning wishlist — the matcher uses this to find teachers.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {me.learnSkills.length === 0 && <p className="text-sm text-muted/70">Add what you've always wanted to learn below.</p>}
              {me.learnSkills.map((s) => (
                <SkillChip key={s.id} name={s.name} type="learn" onRemove={() => removeSkill(s.id)} />
              ))}
            </div>
            <SkillPicker type="learn" existingIds={learnIds} onAdded={refresh} />
          </div>

          {(me.teachSkills.length === 0 || me.learnSkills.length === 0) && (
            <div className="card flex items-start gap-3 border-lime/25 bg-lime/5 p-5 text-sm">
              <Sparkles size={18} className="mt-0.5 shrink-0 text-lime" />
              <p className="text-fg/85">
                <span className="font-bold text-lime">Matcher tip:</span>{" "}
                {me.teachSkills.length === 0 && me.learnSkills.length === 0
                  ? "Add at least one skill to each side to unlock matching."
                  : me.teachSkills.length === 0
                    ? "Add something you can teach to appear in searches."
                    : "Add something you want to learn so we can find your teachers."}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Spinner label="Loading settings" />}>
      <SettingsInner />
    </Suspense>
  );
}
