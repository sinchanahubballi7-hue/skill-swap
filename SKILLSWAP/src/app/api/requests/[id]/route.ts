import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, swapRequests, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

const ALLOWED: Record<string, string[]> = {
  receiver: ["accepted", "rejected", "completed"],
  sender: ["cancelled", "completed"],
};

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const status = String(body.status ?? "");

  const [swap] = await db.select().from(swapRequests).where(eq(swapRequests.id, id)).limit(1);
  if (!swap) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  const isReceiver = swap.receiverId === me.id;
  const isSender = swap.senderId === me.id;
  if (!isReceiver && !isSender) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const role = isReceiver ? "receiver" : "sender";
  if (!ALLOWED[role].includes(status)) {
    return NextResponse.json({ error: "You cannot set that status." }, { status: 400 });
  }
  if (status !== "completed" && swap.status !== "pending") {
    return NextResponse.json({ error: "This request is no longer pending." }, { status: 409 });
  }
  if (status === "completed" && !(swap.status === "accepted" || (isSender && swap.status === "accepted"))) {
    return NextResponse.json({ error: "Only accepted swaps can be completed." }, { status: 409 });
  }

  const [updated] = await db
    .update(swapRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(swapRequests.id, swap.id))
    .returning();

  // notify the other party
  const otherId = isReceiver ? swap.senderId : swap.receiverId;
  const [other] = await db.select().from(users).where(eq(users.id, otherId)).limit(1);
  const verbs: Record<string, string> = {
    accepted: "accepted your swap request",
    rejected: "declined your swap request",
    completed: "marked your swap as completed",
    cancelled: "cancelled their swap request",
  };
  if (other) {
    await db.insert(notifications).values({
      userId: otherId,
      type: status === "accepted" ? "accepted" : status === "completed" ? "completed" : status === "rejected" ? "rejected" : "system",
      title:
        status === "accepted"
          ? "Request accepted"
          : status === "rejected"
            ? "Request declined"
            : status === "completed"
              ? "Swap completed"
              : "Request cancelled",
      body: `${me.name} ${verbs[status]}. ${status === "completed" ? "Leave a review to help the community." : ""}`,
      href: status === "completed" ? `/users/${me.id}` : "/requests",
    });
  }

  return NextResponse.json({ request: updated });
}
