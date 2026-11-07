import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { messages, notifications, reviews, skills, swapRequests, users, userSkills } from "@/db/schema";
import { getSessionUser, publicUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mySkills = await db
    .select({
      id: userSkills.id,
      type: userSkills.type,
      level: userSkills.level,
      skillId: skills.id,
      name: skills.name,
      category: skills.category,
    })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .where(eq(userSkills.userId, user.id));

  const [unreadMessages] = await db
    .select({ value: count() })
    .from(messages)
    .where(and(eq(messages.receiverId, user.id), isNull(messages.readAt)));

  const [unreadNotifications] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));

  const [pendingIncoming] = await db
    .select({ value: count() })
    .from(swapRequests)
    .where(and(eq(swapRequests.receiverId, user.id), eq(swapRequests.status, "pending")));

  const ratingRows = await db
    .select({ rating: reviews.rating })
    .from(reviews)
    .where(eq(reviews.revieweeId, user.id));
  const ratingAvg =
    ratingRows.length === 0
      ? null
      : Math.round((ratingRows.reduce((s, r) => s + r.rating, 0) / ratingRows.length) * 10) / 10;

  return NextResponse.json({
    user: { ...publicUser(user), ratingAvg, ratingCount: ratingRows.length },
    teachSkills: mySkills.filter((s) => s.type === "teach"),
    learnSkills: mySkills.filter((s) => s.type === "learn"),
    unreadMessages: unreadMessages.value,
    unreadNotifications: unreadNotifications.value,
    pendingIncoming: pendingIncoming.value,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const patch: Partial<{ name: string; college: string; year: string; bio: string; avatarColor: string }> = {};
  if (typeof body.name === "string" && body.name.trim().length >= 2) patch.name = body.name.trim();
  if (typeof body.college === "string") patch.college = body.college.trim();
  if (typeof body.year === "string") patch.year = body.year.trim();
  if (typeof body.bio === "string") patch.bio = body.bio.trim().slice(0, 400);
  if (typeof body.avatarColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(body.avatarColor))
    patch.avatarColor = body.avatarColor;

  const [updated] = await db.update(users).set(patch).where(eq(users.id, user.id)).returning();
  return NextResponse.json({ user: publicUser(updated) });
}
