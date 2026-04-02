import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { quizzesTable } from "./quizzes";

// Question types:
//   fill_blank  – { sentence: string, blanks: string[] }  sentence uses ___ as placeholder
//   dropdown    – { stem: string, choices: string[], correct: string }
//   choose_word – { instruction: string, wordLimit: number, passageText?: string, imageUrl?: string, correct: string }
//   matching    – { leftItems: string[], rightItems: string[], pairs: {left:number,right:number}[] }

export const quizQuestionsTable = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // fill_blank | dropdown | choose_word | matching
  order: integer("order").notNull().default(1),
  questionText: text("question_text").notNull().default(""),
  options: jsonb("options").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestionsTable.$inferSelect;
