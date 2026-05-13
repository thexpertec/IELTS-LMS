import { pgTable, text, serial, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type TenantSettings = {
  features: {
    selfRegistration: boolean;
    discussions: boolean;
    quizRetakes: boolean;
    emailNotifications: boolean;
    certificates: boolean;
    maintenanceMode: boolean;
    showStudentProgress: boolean;
    allowFileUploads: boolean;
  };
  portal: {
    welcomeMessage: string;
    supportEmail: string;
    timezone: string;
    defaultLanguage: string;
  };
  branding: {
    tagline: string;
    accentColor: string;
  };
};

export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  features: {
    selfRegistration: false,
    discussions: true,
    quizRetakes: true,
    emailNotifications: false,
    certificates: false,
    maintenanceMode: false,
    showStudentProgress: true,
    allowFileUploads: true,
  },
  portal: {
    welcomeMessage: "",
    supportEmail: "",
    timezone: "UTC",
    defaultLanguage: "en",
  },
  branding: {
    tagline: "",
    accentColor: "",
  },
};

export const tenantsTable = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  dbPrefix: text("db_prefix").notNull().unique(),
  domain: text("domain"),
  adminEmail: text("admin_email").notNull(),
  adminName: text("admin_name"),
  plan: text("plan").notNull().default("trial"),
  status: text("status").notNull().default("active"),
  description: text("description"),
  logoUrl: text("logo_url"),
  website: text("website"),
  phone: text("phone"),
  address: text("address"),
  maxCourses: integer("max_courses"),
  maxStudents: integer("max_students"),
  settings: jsonb("settings").$type<TenantSettings>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTenantSchema = createInsertSchema(tenantsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenantsTable.$inferSelect;
