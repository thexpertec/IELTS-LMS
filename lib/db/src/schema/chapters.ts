import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { coursesTable } from "./courses";

export const chaptersTable = pgTable("chapters", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Chapter = typeof chaptersTable.$inferSelect;
