import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, lessonProgressTable, enrollmentsTable, lessonsTable } from "@workspace/db";
import {
  ListProgressResponse,
  ListProgressQueryParams,
  MarkLessonCompleteBody,
  MarkLessonCompleteResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/progress", async (req, res): Promise<void> => {
  const params = ListProgressQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query = db.select().from(lessonProgressTable);

  if (params.data.enrollmentId) {
    const rows = await db
      .select()
      .from(lessonProgressTable)
      .where(eq(lessonProgressTable.enrollmentId, params.data.enrollmentId));
    res.json(ListProgressResponse.parse(rows));
    return;
  }

  const rows = await query;
  res.json(ListProgressResponse.parse(rows));
});

router.post("/progress", async (req, res): Promise<void> => {
  const parsed = MarkLessonCompleteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { enrollmentId, lessonId, completed } = parsed.data;

  const existing = await db
    .select()
    .from(lessonProgressTable)
    .where(and(eq(lessonProgressTable.enrollmentId, enrollmentId), eq(lessonProgressTable.lessonId, lessonId)));

  let progressRecord;
  if (existing.length > 0) {
    const [updated] = await db
      .update(lessonProgressTable)
      .set({ completed, completedAt: completed ? new Date() : null })
      .where(and(eq(lessonProgressTable.enrollmentId, enrollmentId), eq(lessonProgressTable.lessonId, lessonId)))
      .returning();
    progressRecord = updated;
  } else {
    const [created] = await db
      .insert(lessonProgressTable)
      .values({ enrollmentId, lessonId, completed, completedAt: completed ? new Date() : null })
      .returning();
    progressRecord = created;
  }

  // Recalculate progress percent
  const enrollment = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.id, enrollmentId));
  if (enrollment.length > 0) {
    const courseId = enrollment[0].courseId;
    const totalLessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, courseId));
    const completedLessons = await db
      .select()
      .from(lessonProgressTable)
      .where(and(eq(lessonProgressTable.enrollmentId, enrollmentId), eq(lessonProgressTable.completed, true)));

    const percent = totalLessons.length > 0
      ? Math.round((completedLessons.length / totalLessons.length) * 100)
      : 0;

    await db
      .update(enrollmentsTable)
      .set({ progressPercent: percent })
      .where(eq(enrollmentsTable.id, enrollmentId));
  }

  res.json(MarkLessonCompleteResponse.parse(progressRecord));
});

export default router;
