import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, lessonsTable, chaptersTable } from "@workspace/db";
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

async function lessonWithChapter(courseId: number, lessonId?: number) {
  const rows = await db
    .select({
      id: lessonsTable.id,
      courseId: lessonsTable.courseId,
      chapterId: lessonsTable.chapterId,
      chapterTitle: chaptersTable.title,
      title: lessonsTable.title,
      content: lessonsTable.content,
      videoUrl: lessonsTable.videoUrl,
      imageUrl: lessonsTable.imageUrl,
      audioUrl: lessonsTable.audioUrl,
      durationMinutes: lessonsTable.durationMinutes,
      lessonType: lessonsTable.lessonType,
      order: lessonsTable.order,
      createdAt: lessonsTable.createdAt,
      updatedAt: lessonsTable.updatedAt,
    })
    .from(lessonsTable)
    .leftJoin(chaptersTable, eq(lessonsTable.chapterId, chaptersTable.id))
    .where(
      lessonId !== undefined
        ? and(eq(lessonsTable.courseId, courseId), eq(lessonsTable.id, lessonId))
        : eq(lessonsTable.courseId, courseId)
    )
    .orderBy(lessonsTable.order);
  return rows.map((r) => ({ ...r, chapterTitle: r.chapterTitle ?? null }));
}

router.get("/courses/:courseId/lessons", async (req, res): Promise<void> => {
  const params = ListLessonsParams.safeParse({ courseId: req.params.courseId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const lessons = await lessonWithChapter(params.data.courseId);
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

  const rows = await lessonWithChapter(params.data.courseId, lesson.id);
  res.status(201).json(GetLessonResponse.parse(rows[0]));
});

router.get("/courses/:courseId/lessons/:id", async (req, res): Promise<void> => {
  const params = GetLessonParams.safeParse({ courseId: req.params.courseId, id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await lessonWithChapter(params.data.courseId, params.data.id);
  if (!rows.length) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }
  res.json(GetLessonResponse.parse(rows[0]));
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

  const rows = await lessonWithChapter(params.data.courseId, lesson.id);
  res.json(UpdateLessonResponse.parse(rows[0]));
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
