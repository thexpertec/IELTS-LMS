import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const sessionsTable = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: timestamp("expire", { withTimezone: true, precision: 6 }).notNull(),
    tenantId: integer("tenant_id").references(() => tenantsTable.id, { onDelete: "cascade" }),
  },
  (t) => [index("IDX_sessions_expire").on(t.expire), index("IDX_sessions_tenant").on(t.tenantId)],
);
