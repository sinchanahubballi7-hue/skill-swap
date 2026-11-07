import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { skills, userSkills } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

async function requireAdmin() {
  const me = await getSessionUser();
  if (!me || me.role !== "admin") return null;
  return me;
}

export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const all = await db.select().from(skills).orderBy(asc(skills.category), asc(skills.name));
  const usage = await db
    .select({ skillId: userSkills.skillId, type: userSkills.type, value: count() })
    .from(userSkills)
    .groupBy(userSkills.skillId, userSkills.type);

  const list = all.map((s) => {
    const teach = usage.find((u) => u.skillId === s.id && u.type === "teach")?.value ?? 0;
    const learn = usage.find((u) => u.skillId === s.id && u.type === "learn")?.value ?? 0;
    return { ...s, teachCount: teach, learnCount: learn };
  });
  return NextResponse.json({ skills: list });
}

export async function POST(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const name = String(body.name ?? "").trim().slice(0, 60);
  const category = String(body.category ?? "General").trim();
  if (!name) return NextResponse.json({ error: "Name required." }, { status: 400 });

  const [existing] = await db.select().from(skills).where(eq(skills.name, name)).limit(1);
  if (existing) return NextResponse.json({ error: "Skill already exists." }, { status: 409 });

  const [created] = await db.insert(skills).values({ name, category }).returning();
  return NextResponse.json({ skill: created });
}

export async function DELETE(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const id = Number(body.id);
  await db.delete(skills).where(and(eq(skills.id, id)));
  return NextResponse.json({ ok: true });
}
