import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";

export const discussionsTable = pgTable("discussions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id"),
  studentEmail: text("student_email").notNull(),
  studentName: text("student_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDiscussionSchema = createInsertSchema(discussionsTable).omit({ id: true, createdAt: true });
export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;
export type DiscussionRow = typeof discussionsTable.$inferSelect;
