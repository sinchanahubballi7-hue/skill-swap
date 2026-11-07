import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { pickAvatarColor } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const college = String(body.college ?? "").trim();
    const year = String(body.year ?? "").trim();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (!college) {
      return NextResponse.json({ error: "Please enter your college name." }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        college,
        year,
        avatarColor: pickAvatarColor(email),
      })
      .returning();

    await createSession(user.id);

    await db.insert(notifications).values({
      userId: user.id,
      type: "system",
      title: "Welcome to SkillSwap",
      body: "Complete your profile by adding skills you can teach and skills you want to learn to start matching.",
      href: "/settings",
    });

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    console.error("register error", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
