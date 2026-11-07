"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { AppShell, PageTitle, useMe } from "@/components/app-shell";
import { Avatar, Btn, EmptyState, Spinner } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";

type Conversation = {
  partner: { id: string; name: string; college: string; avatarColor: string };
  lastMessage: string;
  lastMessageAt: string;
  fromMe: boolean;
  unread: number;
};

type ThreadMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

function MessagesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const withUser = params.get("with");
  const { data: me, loading } = useMe();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [partner, setPartner] = useState<Conversation["partner"] | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const d = await res.json();
      setConversations(d.conversations ?? []);
    }
    setLoadingConvs(false);
  }, []);

  const loadThread = useCallback(async () => {
    if (!withUser) return;
    const res = await fetch(`/api/messages/${withUser}`);
    if (res.ok) {
      const d = await res.json();
      setPartner(d.partner);
      setThread((prev) => {
        const changed = prev.length !== d.messages.length;
        if (changed) requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
        return d.messages ?? [];
      });
    } else {
      router.push("/messages");
    }
  }, [withUser, router]);

  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, 5000);
    return () => clearInterval(t);
  }, [loadConversations]);

  useEffect(() => {
    if (!withUser) {
      setPartner(null);
      setThread([]);
      return;
    }
    loadThread();
    const t = setInterval(loadThread, 3000);
    return () => clearInterval(t);
  }, [withUser, loadThread]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !withUser) return;
    setSending(true);
    setDraft("");
    await fetch(`/api/messages/${withUser}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    setSending(false);
    await loadThread();
    await loadConversations();
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
  }

  if (loading || !me) return <Spinner label="Opening chat" />;

  /* ---------------------------- thread view ---------------------------- */
  if (withUser) {
    return (
      <AppShell me={me}>
        <div className="card flex h-[calc(100vh-10rem)] flex-col overflow-hidden">
          {/* thread header */}
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <Link href="/messages" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:text-fg">
              <ArrowLeft size={16} />
            </Link>
            {partner ? (
              <Link href={`/users/${partner.id}`} className="flex items-center gap-3">
                <Avatar name={partner.name} color={partner.avatarColor} size={40} />
                <div>
                  <p className="font-bold">{partner.name}</p>
                  <p className="text-xs text-muted">{partner.college}</p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-muted">Loading…</p>
            )}
            <span className="ml-auto flex items-center gap-2 font-mono-alt text-[10px] uppercase tracking-widest text-mint">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-mint" /> live
            </span>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-6">
            {thread.length === 0 && (
              <p className="py-16 text-center text-sm text-muted">
                No messages yet. Say hi and plan your first swap session.
              </p>
            )}
            {thread.map((m) => {
              const mine = m.senderId === me.user.id;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      mine
                        ? "rounded-br-md bg-lime text-ink"
                        : "rounded-bl-md border border-line bg-panel2"
                    )}
                  >
                    <p>{m.body}</p>
                    <p className={cn("mt-1 text-right font-mono-alt text-[9px] uppercase tracking-widest", mine ? "text-ink/50" : "text-muted/60")}>
                      {timeAgo(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* composer */}
          <form onSubmit={send} className="flex items-center gap-3 border-t border-line p-4">
            <input
              className="field flex-1"
              placeholder={partner ? `Message ${partner.name.split(" ")[0]}…` : "Type a message…"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={1000}
            />
            <Btn type="submit" disabled={sending || !draft.trim()} className="px-4">
              <Send size={16} />
            </Btn>
          </form>
        </div>
      </AppShell>
    );
  }

  /* --------------------------- inbox view --------------------------- */
  return (
    <AppShell me={me}>
      <PageTitle
        eyebrow="// chat system"
        title="Your"
        accent="messages."
        subtitle="Coordinate sessions, share resources, and plan your swaps."
      />
      {loadingConvs ? (
        <Spinner label="Loading inbox" />
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          body="Message a student from their profile to start planning a skill swap."
          action={<Link href="/browse"><Btn size="sm"><MessageCircle size={14} /> Find students</Btn></Link>}
        />
      ) : (
        <div className="card divide-y divide-line">
          {conversations.map((c) => (
            <Link
              key={c.partner.id}
              href={`/messages?with=${c.partner.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]"
            >
              <div className="relative">
                <Avatar name={c.partner.name} color={c.partner.avatarColor} size={48} />
                {c.unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1 text-[10px] font-bold text-ink">
                    {c.unread}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className={cn("truncate text-sm", c.unread > 0 ? "font-bold text-fg" : "font-semibold")}>
                    {c.partner.name}
                  </p>
                  <span className="shrink-0 font-mono-alt text-[10px] uppercase tracking-widest text-muted/60">
                    {timeAgo(c.lastMessageAt)}
                  </span>
                </div>
                <p className={cn("mt-0.5 truncate text-sm", c.unread > 0 ? "text-fg/90" : "text-muted")}>
                  {c.fromMe ? "You: " : ""}{c.lastMessage}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<Spinner label="Opening chat" />}>
      <MessagesInner />
    </Suspense>
  );
}
