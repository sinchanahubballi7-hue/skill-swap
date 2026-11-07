"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Inbox, MessageCircle, Send, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import { AppShell, PageTitle, useMe } from "@/components/app-shell";
import { Avatar, Btn, EmptyState, Spinner, StatusPill } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

type EnrichedRequest = {
  id: string;
  status: string;
  message: string;
  createdAt: string;
  sender: { id: string; name: string; college: string; avatarColor: string } | null;
  receiver: { id: string; name: string; college: string; avatarColor: string } | null;
  teachSkill: { id: number; name: string } | null;
  learnSkill: { id: number; name: string } | null;
};

function SwapLine({ r }: { r: EnrichedRequest }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-panel2 px-4 py-3 text-sm">
      <span className="text-violet">{r.sender?.name.split(" ")[0]} learns</span>
      <span className="font-bold text-fg">{r.learnSkill?.name ?? "a skill"}</span>
      <span className="text-muted">·</span>
      <span className="text-lime">{r.sender?.name.split(" ")[0]} teaches</span>
      <span className="font-bold text-fg">{r.teachSkill?.name ?? "—"}</span>
    </div>
  );
}

export default function RequestsPage() {
  const { data: me, loading } = useMe();
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [incoming, setIncoming] = useState<EnrichedRequest[]>([]);
  const [outgoing, setOutgoing] = useState<EnrichedRequest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/requests");
    if (!res.ok) return;
    const d = await res.json();
    setIncoming(d.incoming ?? []);
    setOutgoing(d.outgoing ?? []);
    setFetching(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, status: string) {
    setBusyId(id);
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    await load();
  }

  if (loading || !me) return <Spinner label="Loading requests" />;

  const list = tab === "incoming" ? incoming : outgoing;
  const pendingIncoming = incoming.filter((r) => r.status === "pending").length;

  return (
    <AppShell me={me}>
      <PageTitle
        eyebrow="// swap requests"
        title="Exchange"
        accent="requests."
        subtitle="Accept trades you like, decline the ones you don't, and mark finished swaps complete so both sides can review."
      />

      {/* tabs */}
      <div className="mb-6 flex gap-2">
        <Btn variant={tab === "incoming" ? "primary" : "secondary"} onClick={() => setTab("incoming")}>
          <Inbox size={15} /> Incoming
          {pendingIncoming > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink/25 px-1 text-[11px] font-bold">
              {pendingIncoming}
            </span>
          )}
        </Btn>
        <Btn variant={tab === "outgoing" ? "primary" : "secondary"} onClick={() => setTab("outgoing")}>
          <Send size={15} /> Outgoing
        </Btn>
      </div>

      {fetching ? (
        <Spinner label="Fetching requests" />
      ) : list.length === 0 ? (
        <EmptyState
          title={tab === "incoming" ? "No requests yet" : "You haven't sent any requests"}
          body={tab === "incoming"
            ? "When students propose a swap, it lands here. Fill out your skills so people can find you."
            : "Browse the campus, find someone who teaches what you want, and suggest a trade."}
          action={<Link href={tab === "incoming" ? "/settings" : "/browse"}><Btn size="sm">{tab === "incoming" ? "Update skills" : "Browse students"}</Btn></Link>}
        />
      ) : (
        <div className="space-y-4">
          {list.map((r) => {
            const other = tab === "incoming" ? r.sender : r.receiver;
            return (
              <div key={r.id} className="card p-6 transition-colors hover:border-fg/15">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <Link href={`/users/${other?.id}`}>
                      <Avatar name={other?.name ?? "?"} color={other?.avatarColor ?? "#888"} size={50} />
                    </Link>
                    <div>
                      <Link href={`/users/${other?.id}`} className="font-bold hover:text-lime">
                        {other?.name ?? "Unknown"}
                      </Link>
                      <p className="text-xs text-muted">{other?.college}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 font-mono-alt text-[10px] uppercase tracking-widest text-muted/60">
                        <CalendarDays size={11} /> {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>

                <SwapLine r={r} />

                {r.message && (
                  <p className="mt-3 rounded-xl border border-line bg-ink/40 px-4 py-3 text-sm italic text-fg/75">
                    &ldquo;{r.message}&rdquo;
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {tab === "incoming" && r.status === "pending" && (
                    <>
                      <Btn size="sm" variant="success" disabled={busyId === r.id} onClick={() => act(r.id, "accepted")}>
                        <ThumbsUp size={14} /> Accept
                      </Btn>
                      <Btn size="sm" variant="danger" disabled={busyId === r.id} onClick={() => act(r.id, "rejected")}>
                        <ThumbsDown size={14} /> Decline
                      </Btn>
                    </>
                  )}
                  {(tab === "incoming" || tab === "outgoing") && r.status === "accepted" && (
                    <Btn size="sm" variant="success" disabled={busyId === r.id} onClick={() => act(r.id, "completed")}
                      className="border-mint/40 bg-mint/15 text-mint hover:bg-mint/25"
                    >
                      <CheckCircle2 size={14} /> Mark completed
                    </Btn>
                  )}
                  {tab === "outgoing" && r.status === "pending" && (
                    <Btn size="sm" variant="ghost" disabled={busyId === r.id} onClick={() => act(r.id, "cancelled")}>
                      <XCircle size={14} /> Cancel request
                    </Btn>
                  )}
                  {(r.status === "accepted" || r.status === "pending") && other && (
                    <Link href={`/messages?with=${other.id}`}>
                      <Btn size="sm" variant="secondary">
                        <MessageCircle size={14} /> Chat
                      </Btn>
                    </Link>
                  )}
                  {r.status === "completed" && other && (
                    <Link href={`/users/${other.id}`}>
                      <Btn size="sm" variant="secondary">Leave a review →</Btn>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
