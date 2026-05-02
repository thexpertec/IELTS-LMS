import { Router, type IRouter } from "express";
import { db, cmsSectionsTable, cmsPostsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

/* ── helpers ── */
function isAdmin(req: any) {
  return req.session?.role === "admin" || req.session?.role === "saas_admin";
}
function requireAdmin(req: any, res: any, next: any) {
  if (!isAdmin(req)) { res.status(401).json({ error: "Unauthorized" }); return; }
  next();
}

/* ═══════════════════════════════════════════════════
   SECTIONS  (landing page content blocks)
═══════════════════════════════════════════════════ */

router.get("/cms/sections", async (req, res): Promise<void> => {
  const rows = await db.select().from(cmsSectionsTable).orderBy(cmsSectionsTable.sectionKey);
  res.json(rows);
});

router.get("/cms/sections/:key", async (req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(cmsSectionsTable)
    .where(eq(cmsSectionsTable.sectionKey, req.params.key))
    .limit(1);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.put("/cms/sections/:key", requireAdmin, async (req, res): Promise<void> => {
  const { key } = req.params;
  const { content, label } = req.body as { content: unknown; label?: string };

  const existing = await db
    .select()
    .from(cmsSectionsTable)
    .where(eq(cmsSectionsTable.sectionKey, key))
    .limit(1);

  if (existing.length > 0) {
    const [row] = await db
      .update(cmsSectionsTable)
      .set({ content: content as any, label, updatedAt: new Date() })
      .where(eq(cmsSectionsTable.sectionKey, key))
      .returning();
    res.json(row);
  } else {
    const [row] = await db
      .insert(cmsSectionsTable)
      .values({ sectionKey: key, content: content as any, label })
      .returning();
    res.json(row);
  }
});

router.delete("/cms/sections/:key", requireAdmin, async (req, res): Promise<void> => {
  await db.delete(cmsSectionsTable).where(eq(cmsSectionsTable.sectionKey, req.params.key));
  res.status(204).send();
});

/* ═══════════════════════════════════════════════════
   POSTS  (blog / news)
═══════════════════════════════════════════════════ */

router.get("/cms/posts", async (req, res): Promise<void> => {
  const adminView = req.query.all === "true" && isAdmin(req);
  const rows = await db
    .select({
      id: cmsPostsTable.id,
      title: cmsPostsTable.title,
      slug: cmsPostsTable.slug,
      excerpt: cmsPostsTable.excerpt,
      coverImage: cmsPostsTable.coverImage,
      author: cmsPostsTable.author,
      status: cmsPostsTable.status,
      tags: cmsPostsTable.tags,
      publishedAt: cmsPostsTable.publishedAt,
      createdAt: cmsPostsTable.createdAt,
      updatedAt: cmsPostsTable.updatedAt,
    })
    .from(cmsPostsTable)
    .where(adminView ? undefined : eq(cmsPostsTable.status, "published"))
    .orderBy(desc(cmsPostsTable.createdAt));
  res.json(rows);
});

router.get("/cms/posts/:slug", async (req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(cmsPostsTable)
    .where(eq(cmsPostsTable.slug, req.params.slug))
    .limit(1);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.post("/cms/posts", requireAdmin, async (req, res): Promise<void> => {
  const { title, slug, excerpt, content, coverImage, author, status, tags } = req.body as {
    title: string; slug: string; excerpt?: string; content?: string;
    coverImage?: string; author?: string; status?: string; tags?: string[];
  };
  if (!title || !slug) { res.status(400).json({ error: "title and slug are required" }); return; }

  const publishedAt = status === "published" ? new Date() : null;
  const [row] = await db
    .insert(cmsPostsTable)
    .values({
      title,
      slug,
      excerpt: excerpt ?? null,
      content: content ?? "",
      coverImage: coverImage ?? null,
      author: author ?? "OneSoft Team",
      status: status ?? "draft",
      tags: tags ?? [],
      publishedAt,
    })
    .returning();
  res.status(201).json(row);
});

router.put("/cms/posts/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const { title, slug, excerpt, content, coverImage, author, status, tags } = req.body;
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) update.title = title;
  if (slug !== undefined) update.slug = slug;
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
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/cms/posts/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(cmsPostsTable).where(eq(cmsPostsTable.id, id));
  res.status(204).send();
});

export default router;
