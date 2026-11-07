import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { reviews, skills, swapRequests, users, userSkills } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user || user.banned) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const theirSkills = await db
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

  const receivedReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      reviewerName: users.name,
      reviewerColor: users.avatarColor,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.reviewerId, users.id))
    .where(eq(reviews.revieweeId, user.id))
    .orderBy(reviews.createdAt);

  receivedReviews.reverse();
  const ratingAvg =
    receivedReviews.length === 0
      ? null
      : Math.round((receivedReviews.reduce((s, r) => s + r.rating, 0) / receivedReviews.length) * 10) / 10;

  // swaps between me and this user
  const swaps = await db
    .select()
    .from(swapRequests)
    .where(
      or(
        and(eq(swapRequests.senderId, me.id), eq(swapRequests.receiverId, user.id)),
        and(eq(swapRequests.senderId, user.id), eq(swapRequests.receiverId, me.id))
      )
    )
    .orderBy(swapRequests.createdAt);
  swaps.reverse();

  // which completed swaps I can still review
  let reviewableSwapId: string | null = null;
  const completed = swaps.filter((s) => s.status === "completed");
  if (completed.length > 0) {
    const myReviews = await db
      .select({ swapId: reviews.swapId })
      .from(reviews)
      .where(and(eq(reviews.reviewerId, me.id), inArray(reviews.swapId, completed.map((s) => s.id))));
    const reviewedIds = new Set(myReviews.map((r) => r.swapId));
    const first = completed.find((s) => !reviewedIds.has(s.id));
    reviewableSwapId = first?.id ?? null;
  }

  // pending request between us (mine → them) prevents duplicates
  const pendingOutgoing = swaps.find((s) => s.senderId === me.id && s.status === "pending") ?? null;
  const pendingIncoming = swaps.find((s) => s.receiverId === me.id && s.status === "pending") ?? null;
  const activeSwap = swaps.find((s) => s.status === "accepted") ?? null;

  const { passwordHash: _ph, ...safeUser } = user;

  return NextResponse.json({
    user: { ...safeUser, ratingAvg, ratingCount: receivedReviews.length },
    teachSkills: theirSkills.filter((s) => s.type === "teach"),
    learnSkills: theirSkills.filter((s) => s.type === "learn"),
    reviews: receivedReviews.slice(0, 20),
    pendingOutgoing,
    pendingIncoming,
    activeSwap,
    hasAcceptedSwap: !!activeSwap || completed.length > 0,
    reviewableSwapId,
  });
}
