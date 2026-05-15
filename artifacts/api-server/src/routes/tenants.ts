import { Router, type IRouter } from "express";
import { eq, ilike, and, inArray, type SQL } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, tenantsTable, coursesTable } from "@workspace/db";
import { DEFAULT_TENANT_SETTINGS } from "@workspace/db/schema";
import { usersTable } from "@workspace/db/schema";
import { generateDbPrefix } from "../lib/db-prefix";
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

  const [tenant] = await db
    .insert(tenantsTable)
    .values({ ...parsed.data, dbPrefix: generateDbPrefix() })
    .returning();
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
  const email = tenant.adminEmail.toLowerCase().trim();
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
    // Also check if the email already exists globally (case-insensitive)
    const [byEmail] = await db
      .select()
      .from(usersTable)
      .where(ilike(usersTable.email, email))
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

// ── Public tenant info (no auth required) ─────────────────────────────────

/**
 * Build an ordered list of domain strings to try when looking up a tenant.
 * Priority: exact match → strip one subdomain level (e.g. lms.erp360.org → erp360.org).
 * This lets the tenant work even if they stored the root domain in their settings.
 */
function domainVariants(host: string): string[] {
  const domain = host.split(":")[0]; // strip port
  if (!domain) return [];
  const variants: string[] = [domain];
  const parts = domain.split(".");
  if (parts.length > 2) {
    variants.push(parts.slice(1).join(".")); // e.g. erp360.org
  }
  return variants;
}

async function findTenantByDomain(host: string) {
  const variants = domainVariants(host);
  if (variants.length === 0) return null;
  const rows = await db
    .select()
    .from(tenantsTable)
    .where(inArray(tenantsTable.domain, variants))
    .limit(1);
  return rows[0] ?? null;
}

// GET /api/tenant/public — returns safe public info for unauthenticated visitors
router.get("/tenant/public", async (req, res): Promise<void> => {
  const tenantId = req.session?.tenantId;
  const host = (req.headers["x-forwarded-host"] ?? req.headers.host ?? "") as string;

  let tenant = null;

  if (tenantId) {
    const rows = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
    tenant = rows[0] ?? null;
  }

  if (!tenant) {
    tenant = await findTenantByDomain(host);
  }

  if (!tenant) {
    res.json(null);
    return;
  }

  res.json({
    name: tenant.name,
    slug: tenant.slug,
    description: tenant.description ?? "",
    logoUrl: tenant.logoUrl ?? "",
    adminEmail: tenant.adminEmail,
    tagline: (tenant.settings as any)?.branding?.tagline ?? "",
    welcomeMessage: (tenant.settings as any)?.portal?.welcomeMessage ?? "",
    accentColor: (tenant.settings as any)?.branding?.accentColor ?? "",
  });
});

// GET /api/tenant/courses — public: returns published courses for this tenant
router.get("/tenant/courses", async (req, res): Promise<void> => {
  const tenantId = req.session?.tenantId;
  const host = (req.headers["x-forwarded-host"] ?? req.headers.host ?? "") as string;

  let resolvedTenantId: number | null = tenantId ?? null;

  if (!resolvedTenantId) {
    const tenant = await findTenantByDomain(host);
    resolvedTenantId = tenant?.id ?? null;
  }

  if (!resolvedTenantId) {
    res.json([]);
    return;
  }

  const courses = await db
    .select({
      id: coursesTable.id,
      title: coursesTable.title,
      description: coursesTable.description,
      category: coursesTable.category,
      level: coursesTable.level,
      durationHours: coursesTable.durationHours,
      instructor: coursesTable.instructor,
      imageUrl: coursesTable.imageUrl,
      enrollmentType: coursesTable.enrollmentType,
      price: coursesTable.price,
      currency: coursesTable.currency,
    })
    .from(coursesTable)
    .where(and(
      eq(coursesTable.tenantId, resolvedTenantId),
      eq(coursesTable.isPublished, true),
    ))
    .orderBy(coursesTable.createdAt);

  res.json(courses);
});

// GET /api/tenant/courses/:id — public: full detail for a single published course
router.get("/tenant/courses/:id", async (req, res): Promise<void> => {
  const courseId = parseInt(req.params.id, 10);
  if (isNaN(courseId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const tenantId = req.session?.tenantId;
  const host = (req.headers["x-forwarded-host"] ?? req.headers.host ?? "") as string;

  let resolvedTenantId: number | null = tenantId ?? null;
  if (!resolvedTenantId) {
    const tenant = await findTenantByDomain(host);
    resolvedTenantId = tenant?.id ?? null;
  }

  if (!resolvedTenantId) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  const [course] = await db
    .select()
    .from(coursesTable)
    .where(and(
      eq(coursesTable.id, courseId),
      eq(coursesTable.tenantId, resolvedTenantId),
      eq(coursesTable.isPublished, true),
    ))
    .limit(1);

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  // Load chapters + lessons (no content, just metadata for public view)
  const { chaptersTable, lessonsTable, quizzesTable, quizQuestionsTable } = await import("@workspace/db");
  const { count } = await import("drizzle-orm");

  const chapters = await db
    .select({ id: chaptersTable.id, title: chaptersTable.title, order: chaptersTable.order })
    .from(chaptersTable)
    .where(eq(chaptersTable.courseId, courseId))
    .orderBy(chaptersTable.order);

  const lessons = await db
    .select({
      id: lessonsTable.id,
      chapterId: lessonsTable.chapterId,
      title: lessonsTable.title,
      lessonType: lessonsTable.lessonType,
      durationMinutes: lessonsTable.durationMinutes,
      order: lessonsTable.order,
    })
    .from(lessonsTable)
    .where(eq(lessonsTable.courseId, courseId))
    .orderBy(lessonsTable.order);

  // Load quizzes linked to lessons of this course (published only for public view)
  const lessonIds = lessons.map((l) => l.id);
  let quizzesByLesson: Record<number, Array<{ id: number; title: string; questionCount: number; timeLimitMinutes: number | null }>> = {};

  if (lessonIds.length > 0) {
    const quizRows = await db
      .select({
        id: quizzesTable.id,
        lessonId: quizzesTable.lessonId,
        title: quizzesTable.title,
        timeLimitMinutes: quizzesTable.timeLimitMinutes,
        questionCount: count(quizQuestionsTable.id),
      })
      .from(quizzesTable)
      .leftJoin(quizQuestionsTable, eq(quizQuestionsTable.quizId, quizzesTable.id))
      .where(and(
        inArray(quizzesTable.lessonId, lessonIds),
        eq(quizzesTable.isPublished, true),
      ))
      .groupBy(quizzesTable.id, quizzesTable.lessonId, quizzesTable.title, quizzesTable.timeLimitMinutes)
      .orderBy(quizzesTable.id);

    for (const q of quizRows) {
      if (!q.lessonId) continue;
      if (!quizzesByLesson[q.lessonId]) quizzesByLesson[q.lessonId] = [];
      quizzesByLesson[q.lessonId].push({
        id: q.id,
        title: q.title,
        questionCount: Number(q.questionCount),
        timeLimitMinutes: q.timeLimitMinutes,
      });
    }
  }

  // Enrollment count (active/completed)
  const { enrollmentsTable } = await import("@workspace/db");
  const [{ enrolled }] = await db
    .select({ enrolled: count() })
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.courseId, courseId));

  const curriculum = chapters.map((ch) => ({
    ...ch,
    lessons: lessons.filter((l) => l.chapterId === ch.id).map((l) => ({
      ...l,
      quizzes: quizzesByLesson[l.id] ?? [],
    })),
  }));

  res.json({
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    durationHours: course.durationHours,
    instructor: course.instructor,
    imageUrl: course.imageUrl,
    enrollmentType: course.enrollmentType,
    price: course.price,
    currency: course.currency,
    maxStudents: course.maxStudents,
    whatYouLearn: course.whatYouLearn ?? [],
    prerequisites: course.prerequisites ?? "",
    enrolledCount: Number(enrolled),
    curriculum,
  });
});

// ── Tenant self-service settings (for LMS admin of a specific tenant) ────────

// GET /api/tenant/settings — returns the current tenant's profile + settings
router.get("/tenant/settings", async (req, res): Promise<void> => {
  const tenantId = req.session.tenantId;
  if (!tenantId) {
    res.status(403).json({ error: "Tenant context required" });
    return;
  }

  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  const merged = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    domain: tenant.domain ?? "",
    website: tenant.website ?? "",
    phone: tenant.phone ?? "",
    address: tenant.address ?? "",
    adminEmail: tenant.adminEmail,
    adminName: tenant.adminName ?? "",
    description: tenant.description ?? "",
    logoUrl: tenant.logoUrl ?? "",
    plan: tenant.plan,
    status: tenant.status,
    maxCourses: tenant.maxCourses,
    maxStudents: tenant.maxStudents,
    settings: {
      features: { ...DEFAULT_TENANT_SETTINGS.features, ...(tenant.settings?.features ?? {}) },
      portal:   { ...DEFAULT_TENANT_SETTINGS.portal,   ...(tenant.settings?.portal   ?? {}) },
      branding: { ...DEFAULT_TENANT_SETTINGS.branding, ...(tenant.settings?.branding ?? {}) },
    },
  };

  res.json(merged);
});

// PATCH /api/tenant/settings — update the current tenant's profile + settings
router.patch("/tenant/settings", async (req, res): Promise<void> => {
  const tenantId = req.session.tenantId;
  if (!tenantId) {
    res.status(403).json({ error: "Tenant context required" });
    return;
  }

  const { name, domain, website, phone, address, adminEmail, adminName, description, logoUrl, settings } = req.body as Record<string, unknown>;

  const updates: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) updates.name = name.trim();
  if (typeof domain === "string") updates.domain = domain.trim() || null;
  if (typeof website === "string") updates.website = website.trim() || null;
  if (typeof phone === "string") updates.phone = phone.trim() || null;
  if (typeof address === "string") updates.address = address.trim() || null;
  if (typeof adminEmail === "string" && adminEmail.trim()) updates.adminEmail = adminEmail.trim();
  if (typeof adminName === "string") updates.adminName = adminName.trim() || null;
  if (typeof description === "string") updates.description = description.trim() || null;
  if (typeof logoUrl === "string") updates.logoUrl = logoUrl.trim() || null;
  if (settings && typeof settings === "object") updates.settings = settings;

  const [updated] = await db
    .update(tenantsTable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set(updates as any)
    .where(eq(tenantsTable.id, tenantId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  res.json({ ok: true });
});

// POST /api/tenant/register-interest — public: capture interest in a course (no auth)
router.post("/tenant/register-interest", async (req, res): Promise<void> => {
  const { courseId, name, email, phone } = req.body as {
    courseId?: number; name?: string; email?: string; phone?: string;
  };

  if (!courseId || !name?.trim() || !email?.trim()) {
    res.status(400).json({ error: "courseId, name and email are required" });
    return;
  }

  const tenantId = req.session?.tenantId;
  const host = (req.headers["x-forwarded-host"] ?? req.headers.host ?? "") as string;
  let resolvedTenantId: number | null = tenantId ?? null;
  if (!resolvedTenantId) {
    const tenant = await findTenantByDomain(host);
    resolvedTenantId = tenant?.id ?? null;
  }
  if (!resolvedTenantId) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  // Verify the course belongs to this tenant
  const { coursesTable: ct } = await import("@workspace/db");
  const [course] = await db
    .select({ id: ct.id, title: ct.title })
    .from(ct)
    .where(and(eq(ct.id, courseId), eq(ct.tenantId, resolvedTenantId)))
    .limit(1);

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  // Store as a pending enrollment record (reuse the enrollments table)
  const { enrollmentsTable: et } = await import("@workspace/db");
  await db
    .insert(et)
    .values({
      courseId,
      studentName: name.trim(),
      studentEmail: email.trim().toLowerCase(),
      status: "active",
      progressPercent: 0,
    })
    .onConflictDoNothing();

  res.json({ ok: true, course: course.title });
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
  req.session.tenantId = id;

  res.json({ ok: true, email: user.email, name: user.name });
});

export default router;
