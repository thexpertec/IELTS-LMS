import { db } from "@workspace/db";
import { tenantsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

interface CachedTenant {
  id: number;
  status: string;
  dbPrefix: string;
  cachedAt: number;
}

const cache = new Map<number, CachedTenant>();
const TTL_MS = 60_000;

export async function getTenantCached(tenantId: number): Promise<CachedTenant | null> {
  const hit = cache.get(tenantId);
  if (hit && Date.now() - hit.cachedAt < TTL_MS) return hit;

  const [tenant] = await db
    .select({ id: tenantsTable.id, status: tenantsTable.status, dbPrefix: tenantsTable.dbPrefix })
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId))
    .limit(1);

  if (!tenant) {
    cache.delete(tenantId);
    return null;
  }

  const entry: CachedTenant = { ...tenant, cachedAt: Date.now() };
  cache.set(tenantId, entry);
  return entry;
}

export function invalidateTenantCache(tenantId: number) {
  cache.delete(tenantId);
}
