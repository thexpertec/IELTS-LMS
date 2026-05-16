import { Router, type IRouter } from "express";
import { eq, like } from "drizzle-orm";
import { db, tenantsTable, cmsSectionsTable, coursesTable } from "@workspace/db";

const router: IRouter = Router();

/* ── helpers ──────────────────────────────────────────────────────────────── */

function domainVariants(host: string): string[] {
  const domain = host.split(":")[0];
  if (!domain) return [];
  const variants: string[] = [domain];
  const parts = domain.split(".");
  if (parts.length > 2) variants.push(parts.slice(1).join("."));
  return variants;
}

async function resolveTenant(req: import("express").Request) {
  const tenantId = req.session?.tenantId;
  if (tenantId) {
    const [t] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
    return t ?? null;
  }
  const host = (req.headers["x-forwarded-host"] ?? req.headers.host ?? "") as string;
  const variants = domainVariants(host);
  if (!variants.length) return null;
  const { inArray } = await import("drizzle-orm");
  const [t] = await db.select().from(tenantsTable).where(inArray(tenantsTable.domain, variants)).limit(1);
  return t ?? null;
}

async function getSeoContent(tenantId: number): Promise<Record<string, unknown>> {
  const key = `t${tenantId}_seo`;
  const [row] = await db.select().from(cmsSectionsTable).where(eq(cmsSectionsTable.sectionKey, key)).limit(1);
  return (row?.content as Record<string, unknown>) ?? {};
}

/* ── GET /api/tenant/robots.txt ───────────────────────────────────────────── */
router.get("/tenant/robots.txt", async (req, res): Promise<void> => {
  const tenant = await resolveTenant(req);

  let body = "User-agent: *\nAllow: /\nDisallow: /student/\nDisallow: /admin-login\n";

  if (tenant) {
    const seo = await getSeoContent(tenant.id);
    if (typeof seo.robotsTxt === "string" && seo.robotsTxt.trim()) {
      body = seo.robotsTxt;
    }
    const sitemapUrl = tenant.domain
      ? `https://${tenant.domain}/api/tenant/sitemap.xml`
      : `\nSitemap: /api/tenant/sitemap.xml`;
    if (!body.includes("Sitemap:")) {
      body += `\nSitemap: ${sitemapUrl}`;
    }
  }

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(body);
});

/* ── GET /api/tenant/sitemap.xml ──────────────────────────────────────────── */
router.get("/tenant/sitemap.xml", async (req, res): Promise<void> => {
  const tenant = await resolveTenant(req);

  const baseUrl = tenant?.domain
    ? `https://${tenant.domain}`
    : `https://${(req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost") as string}`;

  const now = new Date().toISOString().split("T")[0];

  const staticUrls = [
    { loc: `${baseUrl}/`,              priority: "1.0", changefreq: "weekly"  },
    { loc: `${baseUrl}/courses-list`,  priority: "0.9", changefreq: "daily"   },
    { loc: `${baseUrl}/student/login`, priority: "0.5", changefreq: "monthly" },
  ];

  let courseUrls: Array<{ loc: string; priority: string; changefreq: string }> = [];
  if (tenant) {
    const { and } = await import("drizzle-orm");
    const courses = await db
      .select({ id: coursesTable.id, updatedAt: coursesTable.createdAt })
      .from(coursesTable)
      .where(and(eq(coursesTable.tenantId, tenant.id), eq(coursesTable.isPublished, true)));

    courseUrls = courses.map((c) => ({
      loc: `${baseUrl}/courses-list/${c.id}`,
      priority: "0.8",
      changefreq: "weekly",
    }));
  }

  const allUrls = [...staticUrls, ...courseUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(xml);
});

/* ── GET /api/tenant/seo ──────────────────────────────────────────────────── */
router.get("/tenant/seo", async (req, res): Promise<void> => {
  const tenant = await resolveTenant(req);
  if (!tenant) { res.json({}); return; }
  const seo = await getSeoContent(tenant.id);
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json(seo);
});

export default router;
