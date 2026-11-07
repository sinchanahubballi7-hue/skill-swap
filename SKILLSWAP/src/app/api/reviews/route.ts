import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, reviews, swapRequests } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const swapId = String(body.swapId ?? "");
  const rating = Number(body.rating);
  const comment = String(body.comment ?? "").trim().slice(0, 500);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
  }

  const [swap] = await db.select().from(swapRequests).where(eq(swapRequests.id, swapId)).limit(1);
  if (!swap) return NextResponse.json({ error: "Swap not found." }, { status: 404 });
  if (swap.status !== "completed") {
    return NextResponse.json({ error: "You can only review completed swaps." }, { status: 400 });
  }
  if (swap.senderId !== me.id && swap.receiverId !== me.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const revieweeId = swap.senderId === me.id ? swap.receiverId : swap.senderId;

  const dup = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.swapId, swapId), eq(reviews.reviewerId, me.id)))
    .limit(1);
  if (dup.length > 0) return NextResponse.json({ error: "You already reviewed this swap." }, { status: 409 });

  const [created] = await db
    .insert(reviews)
    .values({ swapId, reviewerId: me.id, revieweeId, rating, comment })
    .returning();

  await db.insert(notifications).values({
    userId: revieweeId,
    type: "review",
    title: "New review received",
    body: `${me.name} rated your skill swap ${rating}/5.`,
    href: `/users/${revieweeId}`,
  });

  return NextResponse.json({ review: created });
}
