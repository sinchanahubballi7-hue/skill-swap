import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { skills, userSkills } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const CATEGORIES = [
  "Programming",
  "Design",
  "Music",
  "Languages",
  "Marketing",
  "Data",
  "Business",
  "Science",
  "Writing",
  "Photography",
  "Sports",
  "Lifestyle",
  "General",
];

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const type = body.type === "learn" ? "learn" : "teach";
  const level = LEVELS.includes(body.level) ? body.level : "Intermediate";

  let skillId: number | null = null;

  if (body.skillId) {
    const [s] = await db.select().from(skills).where(eq(skills.id, Number(body.skillId))).limit(1);
    if (!s) return NextResponse.json({ error: "Skill not found." }, { status: 404 });
    skillId = s.id;
  } else if (typeof body.name === "string" && body.name.trim()) {
    const name = body.name.trim().slice(0, 60);
    const category = CATEGORIES.includes(body.category) ? body.category : "General";
    const [existing] = await db.select().from(skills).where(eq(skills.name, name)).limit(1);
    if (existing) {
      skillId = existing.id;
    } else {
      const [created] = await db.insert(skills).values({ name, category }).returning();
      skillId = created.id;
    }
  }

  if (!skillId) return NextResponse.json({ error: "Please choose a skill." }, { status: 400 });

  const dup = await db
    .select()
    .from(userSkills)
    .where(and(eq(userSkills.userId, user.id), eq(userSkills.skillId, skillId), eq(userSkills.type, type)))
    .limit(1);
  if (dup.length > 0) return NextResponse.json({ error: "Skill already added." }, { status: 409 });

  const [row] = await db.insert(userSkills).values({ userId: user.id, skillId, type, level }).returning();
  return NextResponse.json({ ok: true, id: row.id });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db
    .delete(userSkills)
    .where(and(eq(userSkills.id, id), eq(userSkills.userId, user.id)));
  return NextResponse.json({ ok: true });
}
