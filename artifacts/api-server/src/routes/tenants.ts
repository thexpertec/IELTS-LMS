import { Router, type IRouter } from "express";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, tenantsTable } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
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

// GET /api/tenants/:id/credentials — check if login credentials exist for this tenant
router.get("/tenants/:id/credentials", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id)).limit(1);
  if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.tenantId, id))
    .limit(1);

  res.json({ exists: !!user, email: user?.email ?? tenant.adminEmail, name: user?.name ?? tenant.adminName });
});

// POST /api/tenants/:id/credentials — create or reset admin credentials for this tenant
router.post("/tenants/:id/credentials", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { password } = req.body as { password?: string };
  if (!password || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id)).limit(1);
  if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

  const passwordHash = await bcrypt.hash(password, 10);
  const email = tenant.adminEmail;
  const name = tenant.adminName ?? tenant.name;
  const username = `tenant_${tenant.slug}`;

  // Check if a user already exists for this tenant
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.tenantId, id))
    .limit(1);

  if (existing) {
    await db
      .update(usersTable)
      .set({ passwordHash, email, name })
      .where(eq(usersTable.id, existing.id));
    res.json({ email, name, created: false });
  } else {
    // Also check if the email already exists globally
    const [byEmail] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (byEmail) {
      // Claim this user for the tenant
      await db
        .update(usersTable)
        .set({ passwordHash, tenantId: id, role: "admin" })
        .where(eq(usersTable.id, byEmail.id));
      res.json({ email, name, created: false });
    } else {
      await db.insert(usersTable).values({
        email,
        username: username + "_" + Date.now(),
        name,
        passwordHash,
        role: "admin",
        tenantId: id,
      });
      res.status(201).json({ email, name, created: true });
    }
  }
});

// POST /api/tenants/:id/login-as — SaaS admin assumes the tenant's admin session
router.post("/tenants/:id/login-as", async (req, res): Promise<void> => {
  if (req.session.role !== "saas_admin") {
    res.status(403).json({ error: "Only SaaS admins can use this endpoint" });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.tenantId, id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "No admin credentials exist for this tenant. Create credentials first." });
    return;
  }

  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.name = user.name;
  req.session.role = user.role;

  res.json({ ok: true, email: user.email, name: user.name });
});

export default router;
