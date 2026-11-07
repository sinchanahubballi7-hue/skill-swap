import { NextRequest, NextResponse } from "next/server";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, userSkills } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

async function requireAdmin() {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return null;
  return me;
}

export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const all = await db.select().from(users).orderBy(asc(users.createdAt));
  const list = [];
  for (const u of all) {
    const [teach] = await db
      .select({ value: count() })
      .from(userSkills)
      .where(eq(userSkills.userId, u.id));
    const { passwordHash: _ph, ...safe } = u;
    list.push({ ...safe, skillCount: teach.value });
  }
  return NextResponse.json({ users: list });
}

export async function PATCH(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const id = String(body.id ?? "");
  const patch: Partial<{ banned: boolean; role: string }> = {};
  if (typeof body.banned === "boolean") patch.banned = body.banned;
  if (body.role === "admin" || body.role === "student") patch.role = body.role;

  if (id === me.id && (patch.banned || patch.role === "student")) {
    return NextResponse.json({ error: "You cannot ban or demote yourself." }, { status: 400 });
  }

  const [updated] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "User not found." }, { status: 404 });
  const { passwordHash: _ph, ...safe } = updated;
  return NextResponse.json({ user: safe });
}

export async function DELETE(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const id = String(body.id ?? "");
  if (id === me.id) return NextResponse.json({ error: "You cannot delete yourself." }, { status: 400 });

  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}
