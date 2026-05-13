import { pgTable, text, serial, timestamp, integer, bigint } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const mediaFilesTable = pgTable("media_files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  objectPath: text("object_path").notNull(),
  mediaType: text("media_type").notNull(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MediaFile = typeof mediaFilesTable.$inferSelect;
export type InsertMediaFile = typeof mediaFilesTable.$inferInsert;
