import { pgTable, text, serial, timestamp, integer, boolean, jsonb, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";
import { chaptersTable } from "./chapters";
import { lessonsTable } from "./lessons";
import { tenantsTable } from "./tenants";

export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  passageText: text("passage_text"),
  parts: jsonb("parts").$type<Array<{ name: string; from: number; to: number }>>(),
  courseId: integer("course_id").references(() => coursesTable.id, { onDelete: "set null" }),
  chapterId: integer("chapter_id").references(() => chaptersTable.id, { onDelete: "set null" }),
  lessonId: integer("lesson_id").references(() => lessonsTable.id, { onDelete: "set null" }),
  lessonType: text("lesson_type"),
  videoUrl: text("video_url"),
  imageUrls: json("image_urls").$type<string[]>(),
  audioUrls: json("audio_urls").$type<string[]>(),
  timeLimitMinutes: integer("time_limit_minutes"),
  isPublished: boolean("is_published").notNull().default(false),
  tenantId: integer("tenant_id").references(() => tenantsTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertQuizSchema = createInsertSchema(quizzesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzesTable.$inferSelect;
