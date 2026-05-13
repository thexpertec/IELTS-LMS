import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, tenantsTable } from "@workspace/db/schema";
import { ilike, eq } from "drizzle-orm";
import { ensureTenantLessonTypes } from "../lib/ensure-tenant-lesson-types";
import { generateDbPrefix } from "../lib/db-prefix";
import { getTenantCached } from "../lib/tenant-cache";

const router = Router();

function regenerateSession(req: Parameters<typeof Router>[0] extends never ? never : import("express").Request): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = { ...req.session };
    req.session.regenerate((err) => {
      if (err) return reject(err);
      Object.assign(req.session, data);
      resolve();
    });
  });
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(ilike(usersTable.email, email.trim()))
    .limit(1);

  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  let tenantDbPrefix: string | undefined;
  if (user.tenantId) {
    const tenant = await getTenantCached(user.tenantId).catch(() => null);
    if (tenant) tenantDbPrefix = tenant.dbPrefix;
  }

  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.name = user.name;
  req.session.role = user.role;
  req.session.tenantId = user.tenantId ?? undefined;
  req.session.tenantDbPrefix = tenantDbPrefix;

  await new Promise<void>((resolve) => req.session.save(resolve));

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId ?? null,
  });
});

// POST /api/auth/register — self-service admin registration
// Creates a new tenant + admin user in one atomic transaction
router.post("/register", async (req, res) => {
  const { name, email, password, orgName } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    orgName?: string;
  };

  if (!name || !email || !password || !orgName) {
    res.status(400).json({ message: "Name, email, password, and organization name are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(ilike(usersTable.email, normalizedEmail))
    .limit(1);

  if (existing) {
    res.status(409).json({ message: "An account with this email already exists" });
    return;
  }

  const slug = orgName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) + "-" + Date.now().toString(36);

  const dbPrefix = generateDbPrefix();
  const passwordHash = await bcrypt.hash(password, 10);

  const baseUsername = normalizedEmail.split("@")[0]!.replace(/[^a-z0-9_]/g, "_");
  const username = `${baseUsername}_${Date.now().toString(36)}`;

  const { tenant, user } = await db.transaction(async (tx) => {
    const [tenant] = await tx
      .insert(tenantsTable)
      .values({
        name: orgName.trim(),
        slug,
        dbPrefix,
        adminEmail: normalizedEmail,
        adminName: name.trim(),
        plan: "trial",
        status: "active",
      })
      .returning();

    const [user] = await tx
      .insert(usersTable)
      .values({
        name: name.trim(),
        email: normalizedEmail,
        username,
        passwordHash,
        role: "admin",
        tenantId: tenant.id,
      })
      .returning();

    return { tenant, user };
  });

  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.name = user.name;
  req.session.role = user.role;
  req.session.tenantId = user.tenantId ?? undefined;
  req.session.tenantDbPrefix = tenant.dbPrefix;

  if (user.tenantId) {
    await ensureTenantLessonTypes(user.tenantId).catch((err) =>
      console.error("Failed to seed lesson types for new tenant:", err)
    );
  }

  await new Promise<void>((resolve) => req.session.save(resolve));

  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId ?? null,
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  res.json({
    id: req.session.userId,
    email: req.session.email,
    name: req.session.name,
    role: req.session.role,
    tenantId: req.session.tenantId ?? null,
  });
});

export default router;
