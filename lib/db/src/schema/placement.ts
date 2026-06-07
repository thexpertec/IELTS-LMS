import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const placementAttemptsTable = pgTable("placement_attempts", {
  id: serial("id").primaryKey(),
  studentEmail: text("student_email").notNull(),
  tenantId: integer("tenant_id").notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull().default(100),
  level: text("level").notNull(),
  recommendedCourseId: integer("recommended_course_id"),
  source: text("source").notNull().default("online"),
  notes: text("notes"),
  takenAt: timestamp("taken_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courseAssignmentsTable = pgTable("course_assignments", {
  id: serial("id").primaryKey(),
  studentEmail: text("student_email").notNull(),
  courseId: integer("course_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  placementAttemptId: integer("placement_attempt_id"),
  assignedByEmail: text("assigned_by_email").notNull(),
  assignmentType: text("assignment_type").notNull().default("manual"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PlacementAttempt = typeof placementAttemptsTable.$inferSelect;
export type CourseAssignment = typeof courseAssignmentsTable.$inferSelect;
