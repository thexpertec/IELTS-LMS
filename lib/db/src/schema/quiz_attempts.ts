import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { quizzesTable } from "./quizzes";
import { enrollmentsTable } from "./enrollments";

export const quizAttemptsTable = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollmentsTable.id, { onDelete: "cascade" }),
  studentEmail: text("student_email").notNull(),
  score: integer("score"),
  maxScore: integer("max_score").notNull().default(100),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;
