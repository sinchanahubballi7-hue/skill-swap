import { NextRequest, NextResponse } from "next/server";
import { ilike } from "drizzle-orm";
import { db } from "@/db";
import { skills } from "@/db/schema";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  let rows = await db.select().from(skills).orderBy(skills.name);
  if (q) rows = await db.select().from(skills).where(ilike(skills.name, `%${q}%`)).orderBy(skills.name);
  return NextResponse.json({ skills: rows });
}
