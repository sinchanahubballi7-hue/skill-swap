import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { reviews, skills, users, userSkills } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const skillQ = req.nextUrl.searchParams.get("skill")?.trim() ?? "";
  const match = req.nextUrl.searchParams.get("match") === "1";
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 60);

  // all non-admin, non-banned users except me
  let where = and(ne(users.id, me.id), ne(users.role, "admin"), eq(users.banned, false));
  if (q) {
    where = and(
      where,
      or(ilike(users.name, `%${q}%`), ilike(users.college, `%${q}%`))
    );
  }
  const allUsers = await db.select().from(users).where(where).limit(500);

  // my skills for matching
  const mySkills = await db
    .select({ skillId: userSkills.skillId, type: userSkills.type, name: skills.name })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .where(eq(userSkills.userId, me.id));
  const myLearnIds = new Set(mySkills.filter((s) => s.type === "learn").map((s) => s.skillId));
  const myTeachIds = new Set(mySkills.filter((s) => s.type === "teach").map((s) => s.skillId));

  // all user skills
  const allUserSkills = await db
    .select({
      userId: userSkills.userId,
      type: userSkills.type,
      level: userSkills.level,
      skillId: skills.id,
      name: skills.name,
      category: skills.category,
    })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id));

  // ratings
  const allReviews = await db.select({ revieweeId: reviews.revieweeId, rating: reviews.rating }).from(reviews);
  const ratingMap = new Map<string, { sum: number; count: number }>();
  for (const r of allReviews) {
    const cur = ratingMap.get(r.revieweeId) ?? { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    ratingMap.set(r.revieweeId, cur);
  }

  const result = allUsers.map((u) => {
    const rows = allUserSkills.filter((s) => s.userId === u.id);
    const teachSkills = rows.filter((s) => s.type === "teach");
    const learnSkills = rows.filter((s) => s.type === "learn");
    const teachesWhatIWant = teachSkills.filter((s) => myLearnIds.has(s.skillId));
    const wantsWhatITeach = learnSkills.filter((s) => myTeachIds.has(s.skillId));
    const rating = ratingMap.get(u.id);
    return {
      id: u.id,
      name: u.name,
      college: u.college,
      year: u.year,
      bio: u.bio,
      avatarColor: u.avatarColor,
      createdAt: u.createdAt,
      teachSkills,
      learnSkills,
      matchScore: teachesWhatIWant.length * 2 + wantsWhatITeach.length,
      teachesWhatIWant,
      wantsWhatITeach,
      ratingAvg: rating ? Math.round((rating.sum / rating.count) * 10) / 10 : null,
      ratingCount: rating?.count ?? 0,
    };
  });

  let filtered = result;
  if (skillQ) {
    const sq = skillQ.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.teachSkills.some((s) => s.name.toLowerCase().includes(sq)) ||
        u.learnSkills.some((s) => s.name.toLowerCase().includes(sq))
    );
  }
  if (match) {
    filtered = filtered.filter((u) => u.teachesWhatIWant.length > 0);
  }

  filtered.sort((a, b) => b.matchScore - a.matchScore || b.ratingCount - a.ratingCount);

  return NextResponse.json({
    users: filtered.slice(0, Math.min(limit, 200)),
    myTeachCount: myTeachIds.size,
    myLearnCount: myLearnIds.size,
  });
}
