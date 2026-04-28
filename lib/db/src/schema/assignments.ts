import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";
import { chaptersTable } from "./chapters";
import { lessonsTable } from "./lessons";
import { enrollmentsTable } from "./enrollments";
import { tenantsTable } from "./tenants";

export const assignmentsTable = pgTable("assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id").references(() => chaptersTable.id, { onDelete: "set null" }),
  lessonId: integer("lesson_id").references(() => lessonsTable.id, { onDelete: "set null" }),
  lessonType: text("lesson_type"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  type: text("type").notNull().default("assignment"),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  maxScore: integer("max_score").notNull().default(100),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id, { onDelete: "set null" }),
});

export const assignmentSubmissionsTable = pgTable("assignment_submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignmentsTable.id, { onDelete: "cascade" }),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollmentsTable.id, { onDelete: "cascade" }),
  studentEmail: text("student_email").notNull(),
  content: text("content").notNull(),
  score: integer("score"),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAssignmentSchema = createInsertSchema(assignmentsTable).omit({ id: true, createdAt: true });
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type AssignmentRow = typeof assignmentsTable.$inferSelect;

export const insertSubmissionSchema = createInsertSchema(assignmentSubmissionsTable).omit({ id: true, submittedAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type SubmissionRow = typeof assignmentSubmissionsTable.$inferSelect;
