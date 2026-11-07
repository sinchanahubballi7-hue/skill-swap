"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Handshake,
  MessageCircle,
  Send,
  Star,
  X,
} from "lucide-react";
import { AppShell, useMe } from "@/components/app-shell";
import { Avatar, Btn, SkillChip, Spinner, Stars, StatusPill } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

type ProfileData = {
  user: {
    id: string;
    name: string;
    college: string;
    year: string;
    bio: string;
    avatarColor: string;
    createdAt: string;
    ratingAvg: number | null;
    ratingCount: number;
  };
  teachSkills: { id: number; skillId: number; name: string; level: string; category: string }[];
  learnSkills: { skillId: number; name: string }[];
  reviews: {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    reviewerName: string;
    reviewerColor: string;
  }[];
  pendingOutgoing: { id: string } | null;
  pendingIncoming: { id: string } | null;
  activeSwap: { id: string } | null;
  hasAcceptedSwap: boolean;
  reviewableSwapId: string | null;
};

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: me, loading } = useMe();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [showRequest, setShowRequest] = useState(false);
  const [reqLearn, setReqLearn] = useState<number | "">("");
  const [reqTeach, setReqTeach] = useState<number | "">("");
  const [reqMsg, setReqMsg] = useState("");
  const [reqError, setReqError] = useState("");
  const [sending, setSending] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const load = useCallback(() => {
    fetch(`/api/users/${id}`)
      .then(async (r) => {
        if (r.status === 404) setNotFound(true);
        if (!r.ok) return;
        const d: ProfileData = await r.json();
        setProfile(d);
        setReqLearn(d.teachSkills[0]?.skillId ?? "");
      })
      .catch(() => {});
  }, [id]);

  useEffect(load, [load]);

  if (loading || !me) return <Spinner label="Loading profile" />;
  if (notFound)
    return (
      <AppShell me={me}>
        <div className="py-24 text-center text-muted">This student could not be found.</div>
      </AppShell>
    );
  if (!profile) return <Spinner label="Loading profile" />;

  if (profile.user.id === me.user.id) {
    router.replace("/settings");
    return <Spinner label="Opening your profile" />;
  }

  async function sendRequest() {
    setReqError("");
    if (!reqLearn) {
      setReqError("Pick the skill you want to learn.");
      return;
    }
    setSending(true);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: profile!.user.id,
        senderLearnSkillId: reqLearn || null,
        senderTeachSkillId: reqTeach || null,
        message: reqMsg,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setReqError(data.error ?? "Could not send request.");
      return;
    }
    setShowRequest(false);
    load();
  }

  async function submitReview() {
    setReviewError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ swapId: profile!.reviewableSwapId, rating, comment }),
    });
    const data = await res.json();
    if (!res.ok) {
      setReviewError(data.error ?? "Could not submit review.");
      return;
    }
    setReviewSent(true);
    load();
  }

  const u = profile.user;

  return (
    <AppShell me={me}>
      <Link href="/browse" className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg">
        <ArrowLeft size={15} /> Back to browse
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* left: identity card */}
        <div className="card h-fit p-7 lg:sticky lg:top-24">
          <div className="flex items-start justify-between">
            <Avatar name={u.name} color={u.avatarColor} size={80} />
            {u.ratingAvg !== null && (
              <div className="rounded-xl bg-panel2 px-3 py-2 text-center">
                <p className="flex items-center gap-1 text-xl font-bold text-lime">
                  <Star size={15} className="fill-lime text-lime" /> {u.ratingAvg}
                </p>
                <p className="font-mono-alt text-[10px] uppercase tracking-widest text-muted">
                  {u.ratingCount} review{u.ratingCount === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">{u.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {u.college}
            {u.year ? ` · ${u.year}` : ""}
          </p>
          <p className="mt-1 flex items-center gap-1.5 font-mono-alt text-[11px] uppercase tracking-widest text-muted/70">
            <CalendarDays size={12} /> joined {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </p>
          {u.bio && <p className="mt-4 text-sm leading-relaxed text-fg/85">{u.bio}</p>}

          <div className="mt-6 flex flex-col gap-3">
            {profile.pendingIncoming ? (
              <Link href="/requests" className="w-full">
                <Btn className="w-full" variant="primary">
                  <Handshake size={16} /> Respond to their request
                </Btn>
              </Link>
            ) : profile.pendingOutgoing ? (
              <Btn className="w-full" variant="secondary" disabled>
                <Handshake size={16} /> Request sent — awaiting reply
              </Btn>
            ) : (
              <Btn className="w-full" onClick={() => setShowRequest(true)}>
                <Handshake size={16} /> Request skill swap
              </Btn>
            )}
            <Link href={`/messages?with=${u.id}`} className="w-full">
              <Btn variant="secondary" className="w-full">
                <MessageCircle size={16} /> Message {u.name.split(" ")[0]}
              </Btn>
            </Link>
          </div>

          {profile.activeSwap && (
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-sky/10 px-3 py-2 text-xs text-sky">
              <CheckCircle2 size={14} /> You have an active swap in progress.
            </p>
          )}
        </div>

        {/* right: skills + reviews */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-7">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <GraduationCap size={18} className="text-lime" /> Can teach
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.teachSkills.length === 0 && <p className="text-sm text-muted">Nothing listed yet.</p>}
              {profile.teachSkills.map((s) => (
                <SkillChip key={s.id} name={s.name} type="teach" level={s.level} />
              ))}
            </div>
            <h2 className="mt-8 flex items-center gap-2 text-lg font-bold">
              <BookOpen size={18} className="text-violet" /> Wants to learn
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.learnSkills.length === 0 && <p className="text-sm text-muted">Nothing listed yet.</p>}
              {profile.learnSkills.map((s) => (
                <SkillChip key={s.skillId} name={s.name} type="learn" />
              ))}
            </div>
          </div>

          {/* review form */}
          {profile.reviewableSwapId && !reviewSent && (
            <div className="card border-amber/30 p-7">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Star size={18} className="text-amber" /> Rate your completed swap
              </h2>
              <div className="mt-4">
                <Stars value={rating} size={26} interactive onChange={setRating} />
              </div>
              <textarea
                className="field mt-4 min-h-24"
                placeholder={`How was learning with ${u.name.split(" ")[0]}?`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              {reviewError && <p className="mt-2 text-sm text-pink">{reviewError}</p>}
              <Btn className="mt-4" onClick={submitReview}>
                <Send size={15} /> Submit review
              </Btn>
            </div>
          )}

          {/* reviews list */}
          <div className="card p-7">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Star size={18} className="text-lime" /> Reviews ({profile.reviews.length})
            </h2>
            {profile.reviews.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No reviews yet. Be the first to swap with them!</p>
            ) : (
              <div className="mt-4 divide-y divide-line">
                {profile.reviews.map((r) => (
                  <div key={r.id} className="flex gap-4 py-5 first:pt-2">
                    <Avatar name={r.reviewerName} color={r.reviewerColor} size={40} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-semibold">{r.reviewerName}</p>
                        <Stars value={r.rating} size={13} />
                        <span className="font-mono-alt text-[10px] uppercase tracking-widest text-muted/60">
                          {timeAgo(r.createdAt)}
                        </span>
                      </div>
                      {r.comment && <p className="mt-1.5 text-sm leading-relaxed text-fg/80">{r.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------- request modal ------------------------- */}
      {showRequest && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/80 p-4 backdrop-blur-sm sm:items-center">
          <div className="card w-full max-w-lg border-fg/15 p-7 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono-alt text-[11px] uppercase tracking-widest text-lime">// swap request</p>
                <h3 className="mt-1 text-xl font-bold">Propose a trade to {u.name.split(" ")[0]}</h3>
              </div>
              <button onClick={() => setShowRequest(false)} className="text-muted hover:text-fg" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">
                  I want to learn from {u.name.split(" ")[0]}
                </label>
                <select className="field" value={reqLearn} onChange={(e) => setReqLearn(Number(e.target.value))}>
                  {profile.teachSkills.map((s) => (
                    <option key={s.skillId} value={s.skillId}>
                      {s.name} ({s.level})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">
                  I offer to teach in return (optional)
                </label>
                <select className="field" value={reqTeach} onChange={(e) => setReqTeach(e.target.value === "" ? "" : Number(e.target.value))}>
                  <option value="">— pick one of my skills —</option>
                  {me.teachSkills.map((s) => (
                    <option key={s.skillId} value={s.skillId}>
                      {s.name} ({s.level})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block font-mono-alt text-[11px] uppercase tracking-widest text-muted">
                  Message
                </label>
                <textarea
                  className="field min-h-24"
                  placeholder="Hey! I saw you teach Python. I'd love to trade for Figma sessions…"
                  value={reqMsg}
                  onChange={(e) => setReqMsg(e.target.value)}
                />
              </div>
              {reqError && (
                <p className="rounded-lg border border-pink/30 bg-pink/10 px-4 py-2.5 text-sm text-pink">{reqError}</p>
              )}
              <div className="flex justify-end gap-3">
                <Btn variant="ghost" onClick={() => setShowRequest(false)}>Cancel</Btn>
                <Btn onClick={sendRequest} disabled={sending}>
                  <Send size={15} /> {sending ? "Sending…" : "Send request"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
