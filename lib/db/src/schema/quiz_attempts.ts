import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { quizzesTable } from "./quizzes";
import { enrollmentsTable } from "./enrollments";

export const quizAttemptsTable = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
  enrollmentId: integer("enrollment_id").references(() => enrollmentsTable.id, { onDelete: "cascade" }),
  studentEmail: text("student_email").notNull(),
  studentName: text("student_name"),
  score: integer("score"),
  maxScore: integer("max_score").notNull().default(100),
  totalSlots: integer("total_slots"),
  answeredSlots: integer("answered_slots"),
  answers: jsonb("answers"),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;
