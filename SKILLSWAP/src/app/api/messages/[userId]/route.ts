import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { messages, notifications, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await ctx.params;

  const [partner] = await db
    .select({
      id: users.id,
      name: users.name,
      college: users.college,
      avatarColor: users.avatarColor,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!partner) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const thread = await db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.senderId, me.id), eq(messages.receiverId, userId)),
        and(eq(messages.senderId, userId), eq(messages.receiverId, me.id))
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(200);

  // mark as read
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.senderId, userId), eq(messages.receiverId, me.id), isNull(messages.readAt)));

  return NextResponse.json({ partner, messages: thread.reverse() });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await ctx.params;
  const body = await req.json();
  const text = String(body.body ?? "").trim().slice(0, 1000);
  if (!text) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });

  const [partner] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!partner || partner.banned) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const [msg] = await db
    .insert(messages)
    .values({ senderId: me.id, receiverId: userId, body: text })
    .returning();

  // Only create a message notification if there is no unread one from me already
  const [existingUnread] = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, "message"),
        eq(notifications.read, false),
        eq(notifications.href, `/messages?with=${me.id}`)
      )
    )
    .limit(1);

  if (!existingUnread) {
    await db.insert(notifications).values({
      userId,
      type: "message",
      title: "New message",
      body: `${me.name} sent you a message.`,
      href: `/messages?with=${me.id}`,
    });
  }

  return NextResponse.json({ message: msg });
}
