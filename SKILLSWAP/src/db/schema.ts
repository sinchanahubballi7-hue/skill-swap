import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  serial,
} from "drizzle-orm/pg-core";

/* ------------------------------- Users ---------------------------------- */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  college: text("college").notNull().default(""),
  year: text("year").notNull().default(""),
  bio: text("bio").notNull().default(""),
  avatarColor: text("avatar_color").notNull().default("#D9FF4B"),
  role: text("role").notNull().default("student"), // student | admin
  banned: boolean("banned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------ Sessions -------------------------------- */

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------- Skills --------------------------------- */

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull().default("General"),
});

export const userSkills = pgTable("user_skills", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  skillId: integer("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // teach | learn
  level: text("level").notNull().default("Intermediate"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ---------------------------- Swap requests ----------------------------- */

export const swapRequests = pgTable("swap_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  senderTeachSkillId: integer("sender_teach_skill_id").references(
    () => skills.id,
    { onDelete: "set null" }
  ), // what the sender will teach the receiver
  senderLearnSkillId: integer("sender_learn_skill_id").references(
    () => skills.id,
    { onDelete: "set null" }
  ), // what the sender wants to learn from the receiver
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("pending"), // pending | accepted | rejected | completed | cancelled
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------ Messages -------------------------------- */

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------- Reviews -------------------------------- */

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  swapId: uuid("swap_id").references(() => swapRequests.id, {
    onDelete: "cascade",
  }),
  reviewerId: uuid("reviewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  revieweeId: uuid("reviewee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ---------------------------- Notifications ----------------------------- */

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("system"), // request | accepted | rejected | completed | review | message | system
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  href: text("href").notNull().default(""),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* -------------------------------- Types --------------------------------- */

export type User = typeof users.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type UserSkill = typeof userSkills.$inferSelect;
export type SwapRequest = typeof swapRequests.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
