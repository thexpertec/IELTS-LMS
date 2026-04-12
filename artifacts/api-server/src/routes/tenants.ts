import { Router, type IRouter } from "express";
import { eq, ilike, and, count, sql, type SQL } from "drizzle-orm";
import { db, tenantsTable } from "@workspace/db";
import {
  ListTenantsQueryParams,
  ListTenantsResponse,
  CreateTenantBody,
  GetTenantParams,
  GetTenantResponse,
  UpdateTenantParams,
  UpdateTenantBody,
  UpdateTenantResponse,
  DeleteTenantParams,
  GetTenantStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tenants/stats", async (_req, res): Promise<void> => {
  const rows = await db.select().from(tenantsTable);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = {
    total: rows.length,
    active: rows.filter((r) => r.status === "active").length,
    suspended: rows.filter((r) => r.status === "suspended").length,
    cancelled: rows.filter((r) => r.status === "cancelled").length,
    byPlan: rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.plan] = (acc[r.plan] ?? 0) + 1;
      return acc;
    }, {}),
    newThisMonth: rows.filter((r) => new Date(r.createdAt) >= startOfMonth).length,
  };

  res.json(GetTenantStatsResponse.parse(stats));
});

router.get("/tenants", async (req, res): Promise<void> => {
  const query = ListTenantsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status, plan, search } = query.data;
  const conditions: SQL[] = [];
  if (status) conditions.push(eq(tenantsTable.status, status));
  if (plan) conditions.push(eq(tenantsTable.plan, plan));
  if (search) conditions.push(ilike(tenantsTable.name, `%${search}%`));

  const tenants = await db
    .select()
    .from(tenantsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(tenantsTable.createdAt);

  res.json(ListTenantsResponse.parse(tenants));
});

router.post("/tenants", async (req, res): Promise<void> => {
  const parsed = CreateTenantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select({ id: tenantsTable.id })
    .from(tenantsTable)
    .where(eq(tenantsTable.slug, parsed.data.slug));

  if (existing.length > 0) {
    res.status(409).json({ error: "Slug already taken" });
    return;
  }

  const [tenant] = await db.insert(tenantsTable).values(parsed.data).returning();
  res.status(201).json(GetTenantResponse.parse(tenant));
});

router.get("/tenants/:id", async (req, res): Promise<void> => {
  const params = GetTenantParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, params.data.id));
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  res.json(GetTenantResponse.parse(tenant));
});

router.patch("/tenants/:id", async (req, res): Promise<void> => {
  const params = UpdateTenantParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateTenantBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [tenant] = await db
    .update(tenantsTable)
    .set(body.data)
    .where(eq(tenantsTable.id, params.data.id))
    .returning();

  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  res.json(UpdateTenantResponse.parse(tenant));
});

router.delete("/tenants/:id", async (req, res): Promise<void> => {
  const params = DeleteTenantParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(tenantsTable)
    .where(eq(tenantsTable.id, params.data.id))
    .returning({ id: tenantsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  res.status(204).send();
});

export default router;
