import { NextResponse } from "next/server";
import { and, count, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { messages, notifications, skills, swapRequests, userSkills } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [teachCount] = await db
    .select({ value: count() })
    .from(userSkills)
    .where(and(eq(userSkills.userId, me.id), eq(userSkills.type, "teach")));
  const [learnCount] = await db
    .select({ value: count() })
    .from(userSkills)
    .where(and(eq(userSkills.userId, me.id), eq(userSkills.type, "learn")));

  const [activeSwaps] = await db
    .select({ value: count() })
    .from(swapRequests)
    .where(
      and(
        or(eq(swapRequests.senderId, me.id), eq(swapRequests.receiverId, me.id)),
        eq(swapRequests.status, "accepted")
      )
    );

  const [completedSwaps] = await db
    .select({ value: count() })
    .from(swapRequests)
    .where(
      and(
        or(eq(swapRequests.senderId, me.id), eq(swapRequests.receiverId, me.id)),
        eq(swapRequests.status, "completed")
      )
    );

  const [pendingIncoming] = await db
    .select({ value: count() })
    .from(swapRequests)
    .where(and(eq(swapRequests.receiverId, me.id), eq(swapRequests.status, "pending")));

  const [unreadMessages] = await db
    .select({ value: count() })
    .from(messages)
    .where(and(eq(messages.receiverId, me.id), isNull(messages.readAt)));

  const [unreadNotifications] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, me.id), eq(notifications.read, false)));

  const recentNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, me.id))
    .orderBy(desc(notifications.createdAt))
    .limit(6);

  // my recent requests (any direction)
  const recentSwaps = await db
    .select()
    .from(swapRequests)
    .where(or(eq(swapRequests.senderId, me.id), eq(swapRequests.receiverId, me.id)))
    .orderBy(desc(swapRequests.createdAt))
    .limit(5);

  const enrichedSwaps = [];
  for (const r of recentSwaps) {
    const [teach] = r.senderTeachSkillId
      ? await db.select().from(skills).where(eq(skills.id, r.senderTeachSkillId)).limit(1)
      : [null];
    const [learn] = r.senderLearnSkillId
      ? await db.select().from(skills).where(eq(skills.id, r.senderLearnSkillId)).limit(1)
      : [null];
    enrichedSwaps.push({ ...r, teachSkill: teach, learnSkill: learn });
  }

  return NextResponse.json({
    stats: {
      teachCount: teachCount.value,
      learnCount: learnCount.value,
      activeSwaps: activeSwaps.value,
      completedSwaps: completedSwaps.value,
      pendingIncoming: pendingIncoming.value,
      unreadMessages: unreadMessages.value,
      unreadNotifications: unreadNotifications.value,
    },
    recentNotifications,
    recentSwaps: enrichedSwaps,
  });
}
