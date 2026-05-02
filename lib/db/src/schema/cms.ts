import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const cmsSectionsTable = pgTable("cms_sections", {
  id: serial("id").primaryKey(),
  sectionKey: text("section_key").notNull().unique(),
  label: text("label"),
  content: jsonb("content").notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cmsPostsTable = pgTable("cms_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull().default(""),
  coverImage: text("cover_image"),
  author: text("author").notNull().default("OneSoft Team"),
  status: text("status").notNull().default("draft"),
  tags: jsonb("tags").$type<string[]>().default([]),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
