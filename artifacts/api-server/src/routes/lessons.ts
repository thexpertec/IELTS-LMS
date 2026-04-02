import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, lessonsTable } from "@workspace/db";
import {
  ListLessonsResponse,
  ListLessonsParams,
  CreateLessonParams,
  CreateLessonBody,
  GetLessonParams,
  GetLessonResponse,
  UpdateLessonParams,
  UpdateLessonBody,
  UpdateLessonResponse,
  DeleteLessonParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/courses/:courseId/lessons", async (req, res): Promise<void> => {
  const params = ListLessonsParams.safeParse({ courseId: req.params.courseId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const lessons = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.courseId, params.data.courseId))
    .orderBy(lessonsTable.order);

  res.json(ListLessonsResponse.parse(lessons));
});

router.post("/courses/:courseId/lessons", async (req, res): Promise<void> => {
  const params = CreateLessonParams.safeParse({ courseId: req.params.courseId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lesson] = await db
    .insert(lessonsTable)
    .values({ ...parsed.data, courseId: params.data.courseId })
    .returning();

  res.status(201).json(GetLessonResponse.parse(lesson));
});

router.get("/courses/:courseId/lessons/:id", async (req, res): Promise<void> => {
  const params = GetLessonParams.safeParse({ courseId: req.params.courseId, id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(and(eq(lessonsTable.id, params.data.id), eq(lessonsTable.courseId, params.data.courseId)));

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  res.json(GetLessonResponse.parse(lesson));
});

router.patch("/courses/:courseId/lessons/:id", async (req, res): Promise<void> => {
  const params = UpdateLessonParams.safeParse({ courseId: req.params.courseId, id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lesson] = await db
    .update(lessonsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(lessonsTable.id, params.data.id), eq(lessonsTable.courseId, params.data.courseId)))
    .returning();

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  res.json(UpdateLessonResponse.parse(lesson));
});

router.delete("/courses/:courseId/lessons/:id", async (req, res): Promise<void> => {
  const params = DeleteLessonParams.safeParse({ courseId: req.params.courseId, id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lesson] = await db
    .delete(lessonsTable)
    .where(and(eq(lessonsTable.id, params.data.id), eq(lessonsTable.courseId, params.data.courseId)))
    .returning();

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
