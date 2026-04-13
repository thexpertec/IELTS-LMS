import { db } from "@workspace/db";
import { tenantsTable } from "@workspace/db/schema";
import { ensureTenantLessonTypes } from "./ensure-tenant-lesson-types";

export async function seedLessonTypesIfEmpty() {
  try {
    const tenants = await db.select({ id: tenantsTable.id }).from(tenantsTable);
    for (const tenant of tenants) {
      await ensureTenantLessonTypes(tenant.id);
    }
  } catch (err) {
    console.error("Failed to seed lesson types:", err);
  }
}
