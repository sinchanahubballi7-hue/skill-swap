import { NextResponse } from "next/server";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, me.id), eq(messages.receiverId, me.id)))
    .orderBy(desc(messages.createdAt));

  const partnerMap = new Map<string, { lastMessage: (typeof all)[number]; unread: number }>();
  for (const m of all) {
    const partnerId = m.senderId === me.id ? m.receiverId : m.senderId;
    if (!partnerMap.has(partnerId)) {
      partnerMap.set(partnerId, { lastMessage: m, unread: 0 });
    }
    if (m.receiverId === me.id && !m.readAt) {
      partnerMap.get(partnerId)!.unread += 1;
    }
  }

  const conversations = [];
  for (const [partnerId, data] of partnerMap.entries()) {
    const [u] = await db
      .select({
        id: users.id,
        name: users.name,
        college: users.college,
        avatarColor: users.avatarColor,
        banned: users.banned,
      })
      .from(users)
      .where(eq(users.id, partnerId))
      .limit(1);
    if (!u) continue;
    conversations.push({
      partner: u,
      lastMessage: data.lastMessage.body,
      lastMessageAt: data.lastMessage.createdAt,
      fromMe: data.lastMessage.senderId === me.id,
      unread: data.unread,
    });
  }

  const [totalUnread, _n] = await db
    .select()
    .from(messages)
    .where(and(eq(messages.receiverId, me.id), isNull(messages.readAt)))
    .then((rows) => [rows.length, null] as const);

  conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return NextResponse.json({ conversations, totalUnread });
}
