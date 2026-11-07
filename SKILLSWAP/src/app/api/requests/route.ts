import { NextRequest, NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { notifications, skills, swapRequests, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

async function enrich(requests: typeof swapRequests.$inferSelect[]) {
  const out = [];
  for (const r of requests) {
    const [sender] = await db.select().from(users).where(eq(users.id, r.senderId)).limit(1);
    const [receiver] = await db.select().from(users).where(eq(users.id, r.receiverId)).limit(1);
    let teachSkill = null;
    let learnSkill = null;
    if (r.senderTeachSkillId) {
      const [s] = await db.select().from(skills).where(eq(skills.id, r.senderTeachSkillId)).limit(1);
      teachSkill = s ?? null;
    }
    if (r.senderLearnSkillId) {
      const [s] = await db.select().from(skills).where(eq(skills.id, r.senderLearnSkillId)).limit(1);
      learnSkill = s ?? null;
    }
    out.push({
      ...r,
      sender: sender
        ? { id: sender.id, name: sender.name, college: sender.college, avatarColor: sender.avatarColor }
        : null,
      receiver: receiver
        ? { id: receiver.id, name: receiver.name, college: receiver.college, avatarColor: receiver.avatarColor }
        : null,
      teachSkill,
      learnSkill,
    });
  }
  return out;
}

export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const incoming = await db
    .select()
    .from(swapRequests)
    .where(eq(swapRequests.receiverId, me.id))
    .orderBy(swapRequests.createdAt);
  const outgoing = await db
    .select()
    .from(swapRequests)
    .where(eq(swapRequests.senderId, me.id))
    .orderBy(swapRequests.createdAt);

  return NextResponse.json({
    incoming: (await enrich(incoming.reverse())),
    outgoing: (await enrich(outgoing.reverse())),
  });
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const receiverId = String(body.receiverId ?? "");
  const message = String(body.message ?? "").trim().slice(0, 500);
  const senderLearnSkillId = body.senderLearnSkillId ? Number(body.senderLearnSkillId) : null;
  const senderTeachSkillId = body.senderTeachSkillId ? Number(body.senderTeachSkillId) : null;

  if (!receiverId || receiverId === me.id) {
    return NextResponse.json({ error: "Invalid receiver." }, { status: 400 });
  }
  const [receiver] = await db.select().from(users).where(eq(users.id, receiverId)).limit(1);
  if (!receiver || receiver.banned) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // prevent duplicate pending between the same pair
  const dup = await db
    .select()
    .from(swapRequests)
    .where(
      and(
        or(
          and(eq(swapRequests.senderId, me.id), eq(swapRequests.receiverId, receiverId)),
          and(eq(swapRequests.senderId, receiverId), eq(swapRequests.receiverId, me.id))
        ),
        eq(swapRequests.status, "pending")
      )
    )
    .limit(1);
  if (dup.length > 0) {
    return NextResponse.json({ error: "A pending request already exists between you two." }, { status: 409 });
  }

  const [created] = await db
    .insert(swapRequests)
    .values({
      senderId: me.id,
      receiverId,
      senderTeachSkillId,
      senderLearnSkillId,
      message,
      status: "pending",
    })
    .returning();

  const learnName = senderLearnSkillId
    ? (await db.select().from(skills).where(eq(skills.id, senderLearnSkillId)).limit(1))[0]?.name
    : null;

  await db.insert(notifications).values({
    userId: receiverId,
    type: "request",
    title: "New swap request",
    body: `${me.name} wants to swap skills with you${learnName ? ` — they want to learn ${learnName}` : ""}.`,
    href: "/requests",
  });

  return NextResponse.json({ request: created });
}
