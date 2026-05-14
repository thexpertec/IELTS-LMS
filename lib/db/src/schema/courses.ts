import { pgTable, text, serial, timestamp, integer, boolean, real, json } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  instructor: text("instructor").notNull(),
  level: text("level").notNull().default("beginner"),
  imageUrl: text("image_url"),
  durationHours: real("duration_hours"),
  tenantId: integer("tenant_id").references(() => tenantsTable.id, { onDelete: "set null" }),
  isPublished: boolean("is_published").notNull().default(false),
  // Pricing & enrollment
  enrollmentType: text("enrollment_type").notNull().default("free"),
  price: real("price"),
  currency: text("currency").notNull().default("USD"),
  maxStudents: integer("max_students"),
  // Rich course info
  whatYouLearn: json("what_you_learn").$type<string[]>(),
  prerequisites: text("prerequisites"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
