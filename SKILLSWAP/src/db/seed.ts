import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "@/db";
import {
  messages,
  notifications,
  reviews,
  skills,
  swapRequests,
  users,
  userSkills,
} from "@/db/schema";
import { pickAvatarColor } from "@/lib/utils";

const SKILL_CATALOG: [string, string][] = [
  ["Python", "Programming"],
  ["JavaScript", "Programming"],
  ["React", "Programming"],
  ["Java", "Programming"],
  ["C++", "Programming"],
  ["Machine Learning", "Data"],
  ["Data Analysis", "Data"],
  ["SQL", "Data"],
  ["Excel Mastery", "Data"],
  ["Figma", "Design"],
  ["UI Design", "Design"],
  ["Graphic Design", "Design"],
  ["Illustration", "Design"],
  ["Photography", "Photography"],
  ["Video Editing", "Photography"],
  ["Guitar", "Music"],
  ["Piano", "Music"],
  ["Music Production", "Music"],
  ["Spanish", "Languages"],
  ["French", "Languages"],
  ["Japanese", "Languages"],
  ["Copywriting", "Writing"],
  ["Public Speaking", "Writing"],
  ["Creative Writing", "Writing"],
  ["Digital Marketing", "Marketing"],
  ["SEO", "Marketing"],
  ["Entrepreneurship", "Business"],
  ["Finance Basics", "Business"],
  ["Calculus", "Science"],
  ["Physics", "Science"],
  ["Organic Chemistry", "Science"],
  ["Chess", "Sports"],
  ["Yoga", "Sports"],
  ["Football Tactics", "Sports"],
  ["Cooking", "Lifestyle"],
];

const STUDENTS: {
  name: string;
  email: string;
  college: string;
  year: string;
  bio: string;
  teach: [string, string][];
  learn: string[];
}[] = [
  {
    name: "Aisha Verma",
    email: "aisha@campus.edu",
    college: "IIT Bombay",
    year: "3rd Year",
    bio: "CS junior who loves open source, chai, and late-night hackathons. Teaching Python since first year.",
    teach: [["Python", "Expert"], ["Machine Learning", "Advanced"], ["Data Analysis", "Intermediate"]],
    learn: ["Figma", "Guitar"],
  },
  {
    name: "Karan Thakur",
    email: "karan@campus.edu",
    college: "IIT Bombay",
    year: "2nd Year",
    bio: "Backend nerd. Java by day, chess by night. Looking to finally learn design properly.",
    teach: [["Java", "Advanced"], ["C++", "Advanced"], ["Chess", "Expert"]],
    learn: ["Figma", "Public Speaking"],
  },
  {
    name: "Meera Nair",
    email: "meera@campus.edu",
    college: "NIFT Delhi",
    year: "3rd Year",
    bio: "Design student with a soft spot for brand identities and film photography.",
    teach: [["Figma", "Expert"], ["UI Design", "Advanced"], ["Illustration", "Advanced"]],
    learn: ["Python", "React"],
  },
  {
    name: "Rohan Mehta",
    email: "rohan@campus.edu",
    college: "IIT Bombay",
    year: "2nd Year",
    bio: "Frontend dev + bedroom guitarist. If it has six strings or six breakpoints, I'm in.",
    teach: [["React", "Advanced"], ["Guitar", "Intermediate"], ["JavaScript", "Advanced"]],
    learn: ["Music Production", "Machine Learning"],
  },
  {
    name: "Priya Kapoor",
    email: "priya@campus.edu",
    college: "St. Stephen's College",
    year: "4th Year",
    bio: "Economics senior who moonlights as a debate coach. Sold on the idea that anyone can learn to speak well.",
    teach: [["Public Speaking", "Expert"], ["Copywriting", "Advanced"]],
    learn: ["Data Analysis", "Yoga"],
  },
  {
    name: "Arjun Desai",
    email: "arjun@campus.edu",
    college: "BITS Pilani",
    year: "1st Year",
    bio: "Polyglot in progress. Fluent Spanish and French, fighting with Japanese kanji at 2am.",
    teach: [["Spanish", "Expert"], ["French", "Advanced"]],
    learn: ["Japanese", "Photography"],
  },
  {
    name: "Sneha Reddy",
    email: "sneha@campus.edu",
    college: "BITS Pilani",
    year: "3rd Year",
    bio: "Data club lead. I turn messy spreadsheets into dashboards people actually read.",
    teach: [["Data Analysis", "Expert"], ["SQL", "Advanced"], ["Excel Mastery", "Expert"]],
    learn: ["Public Speaking", "Graphic Design"],
  },
  {
    name: "Vikram Iyer",
    email: "vikram@campus.edu",
    college: "Loyola College",
    year: "2nd Year",
    bio: "Physics major who believes calculus is just a language nobody taught us properly.",
    teach: [["Calculus", "Advanced"], ["Physics", "Advanced"]],
    learn: ["Python", "Piano"],
  },
  {
    name: "Tara Menon",
    email: "tara@campus.edu",
    college: "NIFT Delhi",
    year: "1st Year",
    bio: "Photographer and video editor. Always chasing golden hour on campus.",
    teach: [["Photography", "Advanced"], ["Video Editing", "Expert"]],
    learn: ["Copywriting", "SEO"],
  },
  {
    name: "Dev Sharma",
    email: "dev@campus.edu",
    college: "St. Stephen's College",
    year: "4th Year",
    bio: "Startup kid. Built two campus businesses, broke even on one. Happy to pay that tuition forward.",
    teach: [["Entrepreneurship", "Expert"], ["Digital Marketing", "Advanced"], ["Finance Basics", "Intermediate"]],
    learn: ["React", "UI Design"],
  },
];

async function main() {
  console.log("Seeding SkillSwap…");

  // idempotency: skip if admin exists
  const [adminExists] = await db.select().from(users).where(eq(users.email, "admin@skillswap.edu")).limit(1);
  if (adminExists) {
    console.log("Seed already applied — skipping.");
    await pool.end();
    return;
  }

  // skills
  const skillRows = await db
    .insert(skills)
    .values(SKILL_CATALOG.map(([name, category]) => ({ name, category })))
    .returning();
  const skillByName = new Map(skillRows.map((s) => [s.name, s.id]));
  console.log(`✓ ${skillRows.length} skills`);

  // admin
  const adminHash = await bcrypt.hash("admin123", 10);
  const [admin] = await db
    .insert(users)
    .values({
      name: "Platform Admin",
      email: "admin@skillswap.edu",
      passwordHash: adminHash,
      college: "SkillSwap HQ",
      bio: "Keeper of the campus barter economy.",
      role: "admin",
      avatarColor: "#FF6B9D",
    })
    .returning();
  console.log("✓ admin user (admin@skillswap.edu / admin123)");

  // students
  const pw = await bcrypt.hash("password123", 10);
  const createdStudents: (typeof users.$inferSelect & { spec: (typeof STUDENTS)[number] })[] = [];
  for (const s of STUDENTS) {
    const [u] = await db
      .insert(users)
      .values({
        name: s.name,
        email: s.email,
        passwordHash: pw,
        college: s.college,
        year: s.year,
        bio: s.bio,
        avatarColor: pickAvatarColor(s.email),
      })
      .returning();
    createdStudents.push({ ...u, spec: s });

    for (const [skillName, level] of s.teach) {
      const skillId = skillByName.get(skillName);
      if (skillId) await db.insert(userSkills).values({ userId: u.id, skillId, type: "teach", level });
    }
    for (const skillName of s.learn) {
      const skillId = skillByName.get(skillName);
      if (skillId) await db.insert(userSkills).values({ userId: u.id, skillId, type: "learn", level: "Beginner" });
    }
  }
  console.log(`✓ ${createdStudents.length} students with skills`);

  // helper to find student by email
  const by = (email: string) => createdStudents.find((c) => c.email === email)!;

  // swap requests in a spread of states
  const day = 24 * 60 * 60 * 1000;
  const swapsSpec: {
    from: string;
    to: string;
    learn: string;
    teach: string;
    message: string;
    status: string;
    days: number;
  }[] = [
    { from: "aisha@campus.edu", to: "meera@campus.edu", learn: "Figma", teach: "Python", message: "Hey Meera! Your UI work is gorgeous. I can get you from zero to functional Python in 4 weekends if you can teach me Figma basics.", status: "accepted", days: 6 },
    { from: "aisha@campus.edu", to: "rohan@campus.edu", learn: "Guitar", teach: "Machine Learning", message: "Trade ML crash-course for guitar fundamentals? I know literally zero chords.", status: "pending", days: 1 },
    { from: "karan@campus.edu", to: "aisha@campus.edu", learn: "Python", teach: "Chess", message: "I'll make you a 1400-rated player if you make me a decent Python dev.", status: "completed", days: 20 },
    { from: "meera@campus.edu", to: "rohan@campus.edu", learn: "React", teach: "UI Design", message: "I want to build my portfolio site myself. Fair trade: UI critiques for React lessons?", status: "accepted", days: 4 },
    { from: "sneha@campus.edu", to: "priya@campus.edu", learn: "Public Speaking", teach: "Data Analysis", message: "I freeze on stage. You literally win debates. Help!", status: "completed", days: 15 },
    { from: "vikram@campus.edu", to: "aisha@campus.edu", learn: "Python", teach: "Calculus", message: "Physics + calculus tutoring in exchange for Python for scientists?", status: "pending", days: 2 },
    { from: "tara@campus.edu", to: "arjun@campus.edu", learn: "Spanish", teach: "Photography", message: "Teach me enough Spanish to survive a Madrid trip and I'll shoot + edit your profile reel.", status: "rejected", days: 8 },
    { from: "dev@campus.edu", to: "meera@campus.edu", learn: "UI Design", teach: "Digital Marketing", message: "Building a startup landing page that doesn't suck. Marketing for design?", status: "accepted", days: 3 },
    { from: "rohan@campus.edu", to: "sneha@campus.edu", learn: "Data Analysis", teach: "Guitar", message: "Chords for charts, good trade?", status: "pending", days: 0 },
    { from: "priya@campus.edu", to: "dev@campus.edu", learn: "Entrepreneurship", teach: "Copywriting", message: "Your pitch deck needs better words. My startup knowledge needs everything.", status: "completed", days: 12 },
  ];

  const completedSwaps: { id: string; from: string; to: string }[] = [];
  for (const sp of swapsSpec) {
    const [sr] = await db
      .insert(swapRequests)
      .values({
        senderId: by(sp.from).id,
        receiverId: by(sp.to).id,
        senderLearnSkillId: skillByName.get(sp.learn) ?? null,
        senderTeachSkillId: skillByName.get(sp.teach) ?? null,
        message: sp.message,
        status: sp.status,
        createdAt: new Date(Date.now() - sp.days * day),
        updatedAt: new Date(Date.now() - sp.days * day),
      })
      .returning();
    if (sp.status === "completed") completedSwaps.push({ id: sr.id, from: sp.from, to: sp.to });
  }
  console.log(`✓ ${swapsSpec.length} swap requests`);

  // reviews on completed swaps
  const reviewsSpec: { swapFrom: string; swapTo: string; reviewerIsFrom: boolean; rating: number; comment: string }[] = [
    { swapFrom: "karan@campus.edu", swapTo: "aisha@campus.edu", reviewerIsFrom: true, rating: 5, comment: "Aisha explains Python like a story. Went from print('hello') to pandas in three sessions." },
    { swapFrom: "karan@campus.edu", swapTo: "aisha@campus.edu", reviewerIsFrom: false, rating: 5, comment: "Karan's chess lessons were brutal and brilliant. 10/10 would get checkmated again." },
    { swapFrom: "sneha@campus.edu", swapTo: "priya@campus.edu", reviewerIsFrom: true, rating: 5, comment: "Priya rebuilt my confidence stage by stage. First presentation after felt completely different." },
    { swapFrom: "sneha@campus.edu", swapTo: "priya@campus.edu", reviewerIsFrom: false, rating: 4, comment: "Sneha's Excel wizardry is real. One session saved my thesis data section." },
    { swapFrom: "priya@campus.edu", swapTo: "dev@campus.edu", reviewerIsFrom: true, rating: 4, comment: "Dev has real founder scar tissue — pragmatic advice, no fluff." },
    { swapFrom: "priya@campus.edu", swapTo: "dev@campus.edu", reviewerIsFrom: false, rating: 5, comment: "Priya rewrote my pitch deck and my conversion rate doubled. Copywriting is a superpower." },
  ];
  for (const r of reviewsSpec) {
    const swap = completedSwaps.find((c) => c.from === r.swapFrom && c.to === r.swapTo);
    if (!swap) continue;
    const reviewer = r.reviewerIsFrom ? by(r.swapFrom) : by(r.swapTo);
    const reviewee = r.reviewerIsFrom ? by(r.swapTo) : by(r.swapFrom);
    await db.insert(reviews).values({
      swapId: swap.id,
      reviewerId: reviewer.id,
      revieweeId: reviewee.id,
      rating: r.rating,
      comment: r.comment,
    });
  }
  console.log(`✓ ${reviewsSpec.length} reviews`);

  // a live conversation (aisha ⇄ meera)
  const aisha = by("aisha@campus.edu");
  const meera = by("meera@campus.edu");
  const convo: [string, string, number][] = [
    [aisha.id, "Our swap got accepted! First session this Saturday? I can bring my laptop to the library.", 2.2],
    [meera.id, "Perfect. 4pm, 3rd floor quiet zone. I'll prep the Figma 101 deck 🎨", 2.1],
    [aisha.id, "Amazing. I'll set up a Python playground for you beforehand.", 2.0],
    [meera.id, "Also — can we do a quick intro call tonight? 10 mins?", 0.3],
  ];
  for (const [senderId, body, daysAgo] of convo) {
    await db.insert(messages).values({
      senderId,
      receiverId: senderId === aisha.id ? meera.id : aisha.id,
      body,
      readAt: new Date(Date.now() - daysAgo * day + 60000),
      createdAt: new Date(Date.now() - daysAgo * day),
    });
  }
  console.log("✓ seeded a conversation");

  // welcome notifications for everyone
  for (const s of createdStudents) {
    await db.insert(notifications).values({
      userId: s.id,
      type: "system",
      title: "Welcome to SkillSwap",
      body: "Your campus barter economy is live. Browse students and propose your first swap.",
      href: "/browse",
      read: true,
      createdAt: new Date(Date.now() - 30 * day),
    });
  }
  await db.insert(notifications).values({
    userId: aisha.id,
    type: "request",
    title: "New swap request",
    body: "Vikram Iyer wants to swap skills with you — he'd like to learn Python.",
    href: "/requests",
    read: false,
  });
  await db.insert(notifications).values({
    userId: meera.id,
    type: "message",
    title: "New message",
    body: "Aisha Verma sent you a message.",
    href: `/messages?with=${aisha.id}`,
    read: false,
  });
  void admin;

  console.log("Seed complete.");
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
