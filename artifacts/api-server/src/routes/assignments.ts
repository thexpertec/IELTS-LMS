import { Router, type IRouter } from "express";
import { eq, desc, count, and, SQL } from "drizzle-orm";
import { db, assignmentsTable, assignmentSubmissionsTable, coursesTable, enrollmentsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/assignments", async (req, res): Promise<void> => {
  const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
  const tenantId = req.session.tenantId;

  const conditions: SQL[] = [];
  if (courseId) conditions.push(eq(assignmentsTable.courseId, courseId));
  if (tenantId) conditions.push(eq(coursesTable.tenantId, tenantId));

  const rows = await db
    .select({
      id: assignmentsTable.id,
      courseId: assignmentsTable.courseId,
      chapterId: assignmentsTable.chapterId,
      lessonId: assignmentsTable.lessonId,
      lessonType: assignmentsTable.lessonType,
      title: assignmentsTable.title,
      description: assignmentsTable.description,
      type: assignmentsTable.type,
      dueDate: assignmentsTable.dueDate,
      maxScore: assignmentsTable.maxScore,
      createdAt: assignmentsTable.createdAt,
      attachedLinks: assignmentsTable.attachedLinks,
      courseTitle: coursesTable.title,
      submissionCount: count(assignmentSubmissionsTable.id),
    })
    .from(assignmentsTable)
    .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id))
    .leftJoin(assignmentSubmissionsTable, eq(assignmentSubmissionsTable.assignmentId, assignmentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(assignmentsTable.id, coursesTable.title)
    .orderBy(desc(assignmentsTable.createdAt));

  res.json(rows);
});

router.post("/assignments", async (req, res): Promise<void> => {
  const { courseId, chapterId, lessonId, lessonType, title, description, type, dueDate, maxScore } = req.body;
  if (!courseId || !title || !dueDate) {
    res.status(400).json({ error: "courseId, title, and dueDate are required" });
    return;
  }

  const tenantId = req.session.tenantId ?? null;
  const attachedLinks: string[] = Array.isArray(req.body.attachedLinks) ? req.body.attachedLinks : [];

  const [row] = await db.insert(assignmentsTable).values({
    courseId: Number(courseId),
    chapterId: chapterId ? Number(chapterId) : null,
    lessonId: lessonId ? Number(lessonId) : null,
    lessonType: lessonType ?? null,
    title,
    description: description ?? "",
    type: type ?? "assignment",
    dueDate: new Date(dueDate),
    maxScore: maxScore ? Number(maxScore) : 100,
    tenantId,
    attachedLinks,
  }).returning();

  res.status(201).json({ ...row, courseTitle: null, submissionCount: 0 });
});

router.get("/assignments/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db
    .select({
      id: assignmentsTable.id,
      courseId: assignmentsTable.courseId,
      title: assignmentsTable.title,
      description: assignmentsTable.description,
      type: assignmentsTable.type,
      dueDate: assignmentsTable.dueDate,
      maxScore: assignmentsTable.maxScore,
      createdAt: assignmentsTable.createdAt,
      courseTitle: coursesTable.title,
    })
    .from(assignmentsTable)
    .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id))
    .where(eq(assignmentsTable.id, id));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  const submissions = await db
    .select({
      id: assignmentSubmissionsTable.id,
      assignmentId: assignmentSubmissionsTable.assignmentId,
      enrollmentId: assignmentSubmissionsTable.enrollmentId,
      studentEmail: assignmentSubmissionsTable.studentEmail,
      content: assignmentSubmissionsTable.content,
      score: assignmentSubmissionsTable.score,
      feedback: assignmentSubmissionsTable.feedback,
      submittedAt: assignmentSubmissionsTable.submittedAt,
      submissionLinks: assignmentSubmissionsTable.submissionLinks,
      studentName: enrollmentsTable.studentName,
    })
    .from(assignmentSubmissionsTable)
    .leftJoin(enrollmentsTable, eq(assignmentSubmissionsTable.enrollmentId, enrollmentsTable.id))
    .where(eq(assignmentSubmissionsTable.assignmentId, id))
    .orderBy(desc(assignmentSubmissionsTable.submittedAt));

  res.json({ ...row, submissions, submissionCount: submissions.length });
});

router.put("/assignments/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const { title, description, type, dueDate, maxScore, courseId, chapterId, lessonId, lessonType, attachedLinks } = req.body;
  const update: Record<string, unknown> = {};
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (type !== undefined) update.type = type;
  if (dueDate !== undefined) update.dueDate = new Date(dueDate);
  if (maxScore !== undefined) update.maxScore = Number(maxScore);
  if (courseId !== undefined) update.courseId = Number(courseId);
  if (chapterId !== undefined) update.chapterId = chapterId ? Number(chapterId) : null;
  if (lessonId !== undefined) update.lessonId = lessonId ? Number(lessonId) : null;
  if (lessonType !== undefined) update.lessonType = lessonType ?? null;
  if (attachedLinks !== undefined) update.attachedLinks = Array.isArray(attachedLinks) ? attachedLinks : [];

  const [row] = await db.update(assignmentsTable).set(update).where(eq(assignmentsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/assignments/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(assignmentsTable).where(eq(assignmentsTable.id, id));
  res.status(204).send();
});

router.put("/assignments/:id/grade", async (req, res): Promise<void> => {
  const assignmentId = Number(req.params.id);
  if (!assignmentId) { res.status(400).json({ error: "Invalid assignment id" }); return; }

  const { enrollmentId, studentEmail, score, feedback } = req.body;
  if (!enrollmentId || !studentEmail) {
    res.status(400).json({ error: "enrollmentId and studentEmail are required" });
    return;
  }

  const existing = await db
    .select({ id: assignmentSubmissionsTable.id })
    .from(assignmentSubmissionsTable)
    .where(
      and(
        eq(assignmentSubmissionsTable.assignmentId, assignmentId),
        eq(assignmentSubmissionsTable.enrollmentId, Number(enrollmentId))
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const update: Record<string, unknown> = {};
    if (score !== undefined) update.score = score === null ? null : Number(score);
    if (feedback !== undefined) update.feedback = feedback;
    const [row] = await db
      .update(assignmentSubmissionsTable)
      .set(update)
      .where(eq(assignmentSubmissionsTable.id, existing[0].id))
      .returning();
    res.json(row);
  } else {
    const [row] = await db
      .insert(assignmentSubmissionsTable)
      .values({
        assignmentId,
        enrollmentId: Number(enrollmentId),
        studentEmail,
        content: "",
        score: score !== undefined && score !== null ? Number(score) : null,
        feedback: feedback ?? null,
      })
      .returning();
    res.json(row);
  }
});

router.patch("/assignments/:id/submissions/:subId", async (req, res): Promise<void> => {
  const subId = Number(req.params.subId);
  if (!subId) { res.status(400).json({ error: "Invalid subId" }); return; }

  const { score, feedback } = req.body;
  const update: Record<string, unknown> = {};
  if (score !== undefined) update.score = Number(score);
  if (feedback !== undefined) update.feedback = feedback;

  const [row] = await db
    .update(assignmentSubmissionsTable)
    .set(update)
    .where(eq(assignmentSubmissionsTable.id, subId))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

export default router;
