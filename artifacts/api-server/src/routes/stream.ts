import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  announcementsTable,
  discussionsTable,
  assignmentsTable,
  quizzesTable,
} from "@workspace/db";

const router: IRouter = Router();

/* ── ANNOUNCEMENTS ─────────────────────────────────────────── */

router.get("/courses/:courseId/announcements", async (req, res): Promise<void> => {
  const courseId = Number(req.params.courseId);
  if (!courseId) { res.status(400).json({ error: "Invalid courseId" }); return; }

  const rows = await db
    .select()
    .from(announcementsTable)
    .where(eq(announcementsTable.courseId, courseId))
    .orderBy(desc(announcementsTable.createdAt));

  res.json(rows);
});

router.post("/courses/:courseId/announcements", async (req, res): Promise<void> => {
  const courseId = Number(req.params.courseId);
  if (!courseId) { res.status(400).json({ error: "Invalid courseId" }); return; }

  const { title, content, authorName, linkUrl, linkTitle } = req.body as {
    title?: string; content?: string; authorName?: string; linkUrl?: string; linkTitle?: string;
  };
  if (!title || !content) {
    res.status(400).json({ error: "title and content are required" });
    return;
  }

  const [row] = await db
    .insert(announcementsTable)
    .values({
      courseId,
      title,
      content,
      authorName: authorName ?? "Instructor",
      linkUrl: linkUrl?.trim() || null,
      linkTitle: linkTitle?.trim() || null,
    })
    .returning();

  res.status(201).json(row);
});

router.delete("/courses/:courseId/announcements/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  res.status(204).send();
});

/* ── DISCUSSIONS ───────────────────────────────────────────── */

router.get("/courses/:courseId/discussions", async (req, res): Promise<void> => {
  const courseId = Number(req.params.courseId);
  if (!courseId) { res.status(400).json({ error: "Invalid courseId" }); return; }

  const rows = await db
    .select()
    .from(discussionsTable)
    .where(eq(discussionsTable.courseId, courseId))
    .orderBy(desc(discussionsTable.createdAt));

  res.json(rows);
});

router.post("/courses/:courseId/discussions", async (req, res): Promise<void> => {
  const courseId = Number(req.params.courseId);
  if (!courseId) { res.status(400).json({ error: "Invalid courseId" }); return; }

  const { content, studentEmail, studentName } = req.body;
  if (!content || !studentEmail || !studentName) {
    res.status(400).json({ error: "content, studentEmail, and studentName are required" });
    return;
  }

  const [row] = await db
    .insert(discussionsTable)
    .values({ courseId, content, studentEmail, studentName })
    .returning();

  res.status(201).json(row);
});

router.delete("/courses/:courseId/discussions/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(discussionsTable).where(eq(discussionsTable.id, id));
  res.status(204).send();
});

/* ── UPCOMING ──────────────────────────────────────────────── */

router.get("/courses/:courseId/upcoming", async (req, res): Promise<void> => {
  const courseId = Number(req.params.courseId);
  if (!courseId) { res.status(400).json({ error: "Invalid courseId" }); return; }

  const quizzes = await db
    .select({
      id: quizzesTable.id,
      title: quizzesTable.title,
      date: quizzesTable.createdAt,
      isPublished: quizzesTable.isPublished,
    })
    .from(quizzesTable)
    .where(eq(quizzesTable.courseId, courseId));

  const assignments = await db
    .select({
      id: assignmentsTable.id,
      title: assignmentsTable.title,
      date: assignmentsTable.dueDate,
      maxScore: assignmentsTable.maxScore,
    })
    .from(assignmentsTable)
    .where(eq(assignmentsTable.courseId, courseId));

  const items = [
    ...quizzes.map((q) => ({ ...q, type: "quiz" as const, maxScore: null as number | null })),
    ...assignments.map((a) => ({ ...a, type: "assignment" as const, isPublished: null as boolean | null })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  res.json(items);
});

export default router;
