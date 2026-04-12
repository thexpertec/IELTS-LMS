import { Router, type IRouter } from "express";
import { eq, or, and, isNull, inArray } from "drizzle-orm";
import {
  db,
  chatMessagesTable,
  studentProfilesTable,
} from "@workspace/db";
import { usersTable } from "@workspace/db/schema";

const router: IRouter = Router();

// Helper — require authenticated session (admin or student)
function currentEmail(req: Parameters<Parameters<typeof Router>[0]>[0]): string | null {
  return req.session.email ?? null;
}

// ── GET /api/chat/conversations ───────────────────────────────────────────────
// Returns the list of distinct conversation partners for the logged-in user,
// with the latest message snippet and the count of unread messages.
router.get("/chat/conversations", async (req, res): Promise<void> => {
  const myEmail = currentEmail(req);
  if (!myEmail) { res.status(401).json({ error: "Unauthenticated" }); return; }

  const role = req.session.role ?? "student";

  // Pull all messages involving this user
  const allMessages = await db
    .select()
    .from(chatMessagesTable)
    .where(
      or(
        eq(chatMessagesTable.fromEmail, myEmail),
        eq(chatMessagesTable.toEmail, myEmail),
      )
    )
    .orderBy(chatMessagesTable.createdAt);

  // Compute per-partner stats
  const partnerMap = new Map<string, {
    lastMessage: string; lastAt: string; unread: number;
  }>();

  for (const msg of allMessages) {
    const partner = msg.fromEmail === myEmail ? msg.toEmail : msg.fromEmail;
    const existing = partnerMap.get(partner);
    const isUnread = msg.toEmail === myEmail && msg.readAt === null;
    if (!existing) {
      partnerMap.set(partner, {
        lastMessage: msg.content,
        lastAt: msg.createdAt.toISOString(),
        unread: isUnread ? 1 : 0,
      });
    } else {
      existing.lastMessage = msg.content;
      existing.lastAt = msg.createdAt.toISOString();
      if (isUnread) existing.unread++;
    }
  }

  const partnerEmails = Array.from(partnerMap.keys());

  // Fetch display names for all partners
  const nameMap = new Map<string, string>();

  if (partnerEmails.length > 0) {
    const userRows = await db
      .select({ email: usersTable.email, name: usersTable.name })
      .from(usersTable)
      .where(inArray(usersTable.email, partnerEmails));
    for (const u of userRows) nameMap.set(u.email, u.name);

    const profileRows = await db
      .select({ email: studentProfilesTable.email, displayName: studentProfilesTable.displayName })
      .from(studentProfilesTable)
      .where(inArray(studentProfilesTable.email, partnerEmails));
    for (const p of profileRows) {
      if (!nameMap.has(p.email)) nameMap.set(p.email, p.displayName);
    }
  }

  const result: { email: string; name: string; lastMessage: string; lastAt: string; unread: number }[] =
    Array.from(partnerMap.entries())
      .sort((a, b) => b[1].lastAt.localeCompare(a[1].lastAt))
      .map(([email, stats]) => ({
        email,
        name: nameMap.get(email) ?? email,
        ...stats,
      }));

  // If student, also prepend the admin partner info even if no messages yet
  if (role === "student") {
    const tenantId = req.session.tenantId ?? null;
    const adminWhere = tenantId
      ? and(eq(usersTable.role, "admin"), eq(usersTable.tenantId, tenantId))
      : and(eq(usersTable.role, "admin"), isNull(usersTable.tenantId));

    const [admin] = await db
      .select({ email: usersTable.email, name: usersTable.name })
      .from(usersTable)
      .where(adminWhere)
      .limit(1)
      .catch(() => [] as { email: string; name: string }[]);

    if (admin && !result.find((r) => r.email === admin.email)) {
      result.unshift({ email: admin.email, name: admin.name, lastMessage: "", lastAt: new Date().toISOString(), unread: 0 });
    }
  }

  res.json(result);
});

// ── GET /api/chat/messages?with=EMAIL ─────────────────────────────────────────
router.get("/chat/messages", async (req, res): Promise<void> => {
  const myEmail = currentEmail(req);
  if (!myEmail) { res.status(401).json({ error: "Unauthenticated" }); return; }

  const { with: partnerEmail } = req.query as { with?: string };
  if (!partnerEmail) { res.status(400).json({ error: "with= query param required" }); return; }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(
      or(
        and(eq(chatMessagesTable.fromEmail, myEmail), eq(chatMessagesTable.toEmail, partnerEmail)),
        and(eq(chatMessagesTable.fromEmail, partnerEmail), eq(chatMessagesTable.toEmail, myEmail)),
      )
    )
    .orderBy(chatMessagesTable.createdAt);

  res.json(messages.map((m) => ({
    id: m.id,
    fromEmail: m.fromEmail,
    toEmail: m.toEmail,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt?.toISOString() ?? null,
    isOwn: m.fromEmail === myEmail,
  })));
});

// ── POST /api/chat/messages ───────────────────────────────────────────────────
router.post("/chat/messages", async (req, res): Promise<void> => {
  const myEmail = currentEmail(req);
  if (!myEmail) { res.status(401).json({ error: "Unauthenticated" }); return; }

  const { to, content } = req.body as { to?: string; content?: string };
  if (!to?.trim() || !content?.trim()) {
    res.status(400).json({ error: "to and content are required" });
    return;
  }

  const myRole = req.session.role ?? "student";

  // Enforce role rule: students can only message admins
  if (myRole === "student") {
    const [target] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.email, to.trim().toLowerCase()))
      .limit(1);
    if (!target || target.role !== "admin") {
      res.status(403).json({ error: "Students can only send messages to admins" });
      return;
    }
  }

  const [msg] = await db
    .insert(chatMessagesTable)
    .values({ fromEmail: myEmail, toEmail: to.trim().toLowerCase(), content: content.trim() })
    .returning();

  res.status(201).json({
    id: msg.id,
    fromEmail: msg.fromEmail,
    toEmail: msg.toEmail,
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
    readAt: null,
    isOwn: true,
  });
});

// ── PATCH /api/chat/read?from=EMAIL ──────────────────────────────────────────
// Mark all messages from `from` to current user as read
router.patch("/chat/read", async (req, res): Promise<void> => {
  const myEmail = currentEmail(req);
  if (!myEmail) { res.status(401).json({ error: "Unauthenticated" }); return; }

  const { from: fromEmail } = req.query as { from?: string };
  if (!fromEmail) { res.status(400).json({ error: "from= query param required" }); return; }

  await db
    .update(chatMessagesTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(chatMessagesTable.fromEmail, fromEmail),
        eq(chatMessagesTable.toEmail, myEmail),
        isNull(chatMessagesTable.readAt),
      )
    );

  res.json({ ok: true });
});

export default router;
