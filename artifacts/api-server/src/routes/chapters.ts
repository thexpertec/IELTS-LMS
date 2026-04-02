import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, chaptersTable, lessonsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/courses/:courseId/chapters", async (req, res): Promise<void> => {
  const courseId = parseInt(req.params.courseId, 10);
  if (isNaN(courseId)) {
    res.status(400).json({ error: "Invalid courseId" });
    return;
  }
  const chapters = await db
    .select()
    .from(chaptersTable)
    .where(eq(chaptersTable.courseId, courseId))
    .orderBy(chaptersTable.order);
  res.json(chapters);
});

router.post("/courses/:courseId/chapters", async (req, res): Promise<void> => {
  const courseId = parseInt(req.params.courseId, 10);
  if (isNaN(courseId)) {
    res.status(400).json({ error: "Invalid courseId" });
    return;
  }
  const { title, order } = req.body as { title?: string; order?: number };
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const [chapter] = await db
    .insert(chaptersTable)
    .values({ courseId, title, order: order ?? 1 })
    .returning();
  res.status(201).json(chapter);
});

router.put("/courses/:courseId/chapters/:chapterId", async (req, res): Promise<void> => {
  const courseId = parseInt(req.params.courseId, 10);
  const chapterId = parseInt(req.params.chapterId, 10);
  if (isNaN(courseId) || isNaN(chapterId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { title, order } = req.body as { title?: string; order?: number };
  const updates: Partial<{ title: string; order: number }> = {};
  if (title !== undefined) updates.title = title;
  if (order !== undefined) updates.order = order;

  const [chapter] = await db
    .update(chaptersTable)
    .set(updates)
    .where(and(eq(chaptersTable.id, chapterId), eq(chaptersTable.courseId, courseId)))
    .returning();

  if (!chapter) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }
  res.json(chapter);
});

router.delete("/courses/:courseId/chapters/:chapterId", async (req, res): Promise<void> => {
  const courseId = parseInt(req.params.courseId, 10);
  const chapterId = parseInt(req.params.chapterId, 10);
  if (isNaN(courseId) || isNaN(chapterId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .update(lessonsTable)
    .set({ chapterId: null })
    .where(and(eq(lessonsTable.chapterId, chapterId), eq(lessonsTable.courseId, courseId)));

  const [chapter] = await db
    .delete(chaptersTable)
    .where(and(eq(chaptersTable.id, chapterId), eq(chaptersTable.courseId, courseId)))
    .returning();

  if (!chapter) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
