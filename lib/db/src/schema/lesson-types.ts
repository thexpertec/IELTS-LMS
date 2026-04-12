import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lessonTypesTable = pgTable("lesson_types", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  icon: text("icon").notNull().default("BookOpen"),
  color: text("color").notNull().default("text-blue-600"),
  bg: text("bg").notNull().default("bg-blue-50 dark:bg-blue-950/30"),
  order: integer("order").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLessonTypeSchema = createInsertSchema(lessonTypesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLessonType = z.infer<typeof insertLessonTypeSchema>;
export type LessonType = typeof lessonTypesTable.$inferSelect;
