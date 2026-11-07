import { NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, reviews, skills, swapRequests, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

async function requireAdmin() {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return null;
  return me;
}

export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [userCount] = await db.select({ value: count() }).from(users);
  const [skillCount] = await db.select({ value: count() }).from(skills);
  const [requestCount] = await db.select({ value: count() }).from(swapRequests);
  const [pendingCount] = await db
    .select({ value: count() })
    .from(swapRequests)
    .where(eq(swapRequests.status, "pending"));
  const [completedCount] = await db
    .select({ value: count() })
    .from(swapRequests)
    .where(eq(swapRequests.status, "completed"));
  const [messageCount] = await db.select({ value: count() }).from(messages);
  const [reviewCount] = await db.select({ value: count() }).from(reviews);
  const [bannedCount] = await db.select({ value: count() }).from(users).where(eq(users.banned, true));

  const recentRequests = await db
    .select()
    .from(swapRequests)
    .orderBy(desc(swapRequests.createdAt))
    .limit(12);

  const enriched = [];
  for (const r of recentRequests) {
    const [sender] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, r.senderId))
      .limit(1);
    const [receiver] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, r.receiverId))
      .limit(1);
    const [learnSkill] = r.senderLearnSkillId
      ? await db.select().from(skills).where(eq(skills.id, r.senderLearnSkillId)).limit(1)
      : [null];
    const [teachSkill] = r.senderTeachSkillId
      ? await db.select().from(skills).where(eq(skills.id, r.senderTeachSkillId)).limit(1)
      : [null];
    enriched.push({ ...r, sender, receiver, learnSkill, teachSkill });
  }

  return NextResponse.json({
    stats: {
      users: userCount.value,
      skills: skillCount.value,
      requests: requestCount.value,
      pending: pendingCount.value,
      completed: completedCount.value,
      messages: messageCount.value,
      reviews: reviewCount.value,
      banned: bannedCount.value,
    },
    recentRequests: enriched,
  });
}
