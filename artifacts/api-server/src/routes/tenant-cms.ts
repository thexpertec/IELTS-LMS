import { Router, type IRouter } from "express";
import { db, cmsSectionsTable, cmsPostsTable } from "@workspace/db";
import { eq, like, desc } from "drizzle-orm";

const router: IRouter = Router();

function requireTenantAdmin(req: any, res: any, next: any) {
  const role = req.session?.role;
  if (role !== "admin" && role !== "saas_admin") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function getTenantId(req: any): number | null {
  return req.session?.tenantId ?? null;
}

/* ───────────────────────────────────────────────────
   SECTIONS  (tenant-scoped portal page content)
─────────────────────────────────────────────────── */

// GET /api/tenant-cms/sections
router.get("/tenant-cms/sections", requireTenantAdmin, async (req, res): Promise<void> => {
  const tid = getTenantId(req);
  if (!tid) { res.status(400).json({ error: "No tenant context" }); return; }
  const prefix = `t${tid}_`;
  const rows = await db
    .select()
    .from(cmsSectionsTable)
    .where(like(cmsSectionsTable.sectionKey, `${prefix}%`))
    .orderBy(cmsSectionsTable.sectionKey);
  res.json(rows);
});

// PUT /api/tenant-cms/sections/:key
router.put("/tenant-cms/sections/:key", requireTenantAdmin, async (req, res): Promise<void> => {
  const tid = getTenantId(req);
  if (!tid) { res.status(400).json({ error: "No tenant context" }); return; }
  const fullKey = `t${tid}_${req.params.key}`;
  const { content, label } = req.body as { content: unknown; label?: string };

  const existing = await db
    .select()
    .from(cmsSectionsTable)
    .where(eq(cmsSectionsTable.sectionKey, fullKey))
    .limit(1);

  if (existing.length > 0) {
    const [row] = await db
      .update(cmsSectionsTable)
      .set({ content: content as any, label, updatedAt: new Date() })
      .where(eq(cmsSectionsTable.sectionKey, fullKey))
      .returning();
    res.json(row);
  } else {
    const [row] = await db
      .insert(cmsSectionsTable)
      .values({ sectionKey: fullKey, content: content as any, label })
      .returning();
    res.json(row);
  }
});

// DELETE /api/tenant-cms/sections/:key
router.delete("/tenant-cms/sections/:key", requireTenantAdmin, async (req, res): Promise<void> => {
  const tid = getTenantId(req);
  if (!tid) { res.status(400).json({ error: "No tenant context" }); return; }
  const fullKey = `t${tid}_${req.params.key}`;
  await db.delete(cmsSectionsTable).where(eq(cmsSectionsTable.sectionKey, fullKey));
  res.status(204).send();
});

/* ───────────────────────────────────────────────────
   POSTS  (tenant-scoped blog / announcements)
─────────────────────────────────────────────────── */

// GET /api/tenant-cms/posts
router.get("/tenant-cms/posts", requireTenantAdmin, async (req, res): Promise<void> => {
  const tid = getTenantId(req);
  if (!tid) { res.status(400).json({ error: "No tenant context" }); return; }
  const prefix = `t${tid}-`;
  const rows = await db
    .select()
    .from(cmsPostsTable)
    .where(like(cmsPostsTable.slug, `${prefix}%`))
    .orderBy(desc(cmsPostsTable.createdAt));
  res.json(rows);
});

// GET /api/tenant-cms/posts/:id
router.get("/tenant-cms/posts/:id", requireTenantAdmin, async (req, res): Promise<void> => {
  const tid = getTenantId(req);
  if (!tid) { res.status(400).json({ error: "No tenant context" }); return; }
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db
    .select()
    .from(cmsPostsTable)
    .where(eq(cmsPostsTable.id, id))
    .limit(1);
  if (!row || !row.slug.startsWith(`t${tid}-`)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

// POST /api/tenant-cms/posts
router.post("/tenant-cms/posts", requireTenantAdmin, async (req, res): Promise<void> => {
  const tid = getTenantId(req);
  if (!tid) { res.status(400).json({ error: "No tenant context" }); return; }

  const { title, slug, excerpt, content, coverImage, author, status, tags } = req.body as {
    title: string; slug: string; excerpt?: string; content?: string;
    coverImage?: string; author?: string; status?: string; tags?: string[];
  };
  if (!title || !slug) { res.status(400).json({ error: "title and slug required" }); return; }

  const fullSlug = `t${tid}-${slug}`;
  const publishedAt = status === "published" ? new Date() : null;

  const [row] = await db
    .insert(cmsPostsTable)
    .values({
      title,
      slug: fullSlug,
      excerpt: excerpt ?? null,
      content: content ?? "",
      coverImage: coverImage ?? null,
      author: author ?? "Academy Admin",
      status: status ?? "draft",
      tags: tags ?? [],
      publishedAt,
    })
    .returning();
  res.status(201).json(row);
});

// PUT /api/tenant-cms/posts/:id
router.put("/tenant-cms/posts/:id", requireTenantAdmin, async (req, res): Promise<void> => {
  const tid = getTenantId(req);
  if (!tid) { res.status(400).json({ error: "No tenant context" }); return; }
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const existing = await db
    .select()
    .from(cmsPostsTable)
    .where(eq(cmsPostsTable.id, id))
    .limit(1);
  if (!existing[0] || !existing[0].slug.startsWith(`t${tid}-`)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const { title, slug, excerpt, content, coverImage, author, status, tags } = req.body;
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) update.title = title;
  if (slug !== undefined) update.slug = `t${tid}-${slug}`;
  if (excerpt !== undefined) update.excerpt = excerpt;
  if (content !== undefined) update.content = content;
  if (coverImage !== undefined) update.coverImage = coverImage;
  if (author !== undefined) update.author = author;
  if (tags !== undefined) update.tags = tags;
  if (status !== undefined) {
    update.status = status;
    if (status === "published") update.publishedAt = new Date();
  }

  const [row] = await db
    .update(cmsPostsTable)
    .set(update)
    .where(eq(cmsPostsTable.id, id))
    .returning();
  res.json(row);
});

// DELETE /api/tenant-cms/posts/:id
router.delete("/tenant-cms/posts/:id", requireTenantAdmin, async (req, res): Promise<void> => {
  const tid = getTenantId(req);
  if (!tid) { res.status(400).json({ error: "No tenant context" }); return; }
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const existing = await db
    .select()
    .from(cmsPostsTable)
    .where(eq(cmsPostsTable.id, id))
    .limit(1);
  if (!existing[0] || !existing[0].slug.startsWith(`t${tid}-`)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.delete(cmsPostsTable).where(eq(cmsPostsTable.id, id));
  res.status(204).send();
});

export default router;
