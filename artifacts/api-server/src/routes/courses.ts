import { Router, type IRouter } from "express";
import { eq, ilike, and, inArray, type SQL } from "drizzle-orm";
import { db, coursesTable, enrollmentsTable, assignmentsTable, assignmentSubmissionsTable, quizzesTable, quizAttemptsTable } from "@workspace/db";
import {
  ListCoursesResponse,
  CreateCourseBody,
  GetCourseParams,
  GetCourseResponse,
  UpdateCourseParams,
  UpdateCourseBody,
  UpdateCourseResponse,
  DeleteCourseParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/courses", async (req, res): Promise<void> => {
  const { category, search } = req.query as { category?: string; search?: string };
  const tenantId = req.session.tenantId;

  const conditions: SQL[] = [];
  if (tenantId) conditions.push(eq(coursesTable.tenantId, tenantId));
  if (category) conditions.push(eq(coursesTable.category, category));
  if (search) conditions.push(ilike(coursesTable.title, `%${search}%`));

  const courses = await db
    .select()
    .from(coursesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(coursesTable.createdAt);

  res.json(ListCoursesResponse.parse(courses));
});

router.post("/courses", async (req, res): Promise<void> => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const tenantId = req.session.tenantId;
  const values = tenantId ? { ...parsed.data, tenantId } : parsed.data;

  const [course] = await db.insert(coursesTable).values(values).returning();
  res.status(201).json(GetCourseResponse.parse(course));
});

router.get("/courses/:id", async (req, res): Promise<void> => {
  const params = GetCourseParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const tenantId = req.session.tenantId;
  const conditions: SQL[] = [eq(coursesTable.id, params.data.id)];
  if (tenantId) conditions.push(eq(coursesTable.tenantId, tenantId));

  const [course] = await db.select().from(coursesTable).where(and(...conditions));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  res.json(GetCourseResponse.parse(course));
});

router.patch("/courses/:id", async (req, res): Promise<void> => {
  const params = UpdateCourseParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const tenantId = req.session.tenantId;
  const conditions: SQL[] = [eq(coursesTable.id, params.data.id)];
  if (tenantId) conditions.push(eq(coursesTable.tenantId, tenantId));

  const [course] = await db
    .update(coursesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(...conditions))
    .returning();

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  res.json(UpdateCourseResponse.parse(course));
});

router.delete("/courses/:id", async (req, res): Promise<void> => {
  const params = DeleteCourseParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const tenantId = req.session.tenantId;
  const conditions: SQL[] = [eq(coursesTable.id, params.data.id)];
  if (tenantId) conditions.push(eq(coursesTable.tenantId, tenantId));

  const [course] = await db.delete(coursesTable).where(and(...conditions)).returning();
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/courses/:id/gradebook", async (req, res): Promise<void> => {
  const courseId = Number(req.params.id);
  if (!courseId) { res.status(400).json({ error: "Invalid id" }); return; }

  const tenantId = req.session.tenantId;
  if (tenantId) {
    const [course] = await db.select({ id: coursesTable.id }).from(coursesTable)
      .where(and(eq(coursesTable.id, courseId), eq(coursesTable.tenantId, tenantId)));
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
  }

  const enrollments = await db
    .select({
      id: enrollmentsTable.id,
      studentEmail: enrollmentsTable.studentEmail,
      studentName: enrollmentsTable.studentName,
      status: enrollmentsTable.status,
    })
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.courseId, courseId))
    .orderBy(enrollmentsTable.studentName);

  const assignments = await db
    .select({
      id: assignmentsTable.id,
      title: assignmentsTable.title,
      dueDate: assignmentsTable.dueDate,
      maxScore: assignmentsTable.maxScore,
      createdAt: assignmentsTable.createdAt,
    })
    .from(assignmentsTable)
    .where(eq(assignmentsTable.courseId, courseId))
    .orderBy(assignmentsTable.dueDate);

  const assignmentIds = assignments.map((a) => a.id);
  const submissions = assignmentIds.length > 0
    ? await db
        .select({
          id: assignmentSubmissionsTable.id,
          assignmentId: assignmentSubmissionsTable.assignmentId,
          enrollmentId: assignmentSubmissionsTable.enrollmentId,
          studentEmail: assignmentSubmissionsTable.studentEmail,
          content: assignmentSubmissionsTable.content,
          score: assignmentSubmissionsTable.score,
          feedback: assignmentSubmissionsTable.feedback,
          submittedAt: assignmentSubmissionsTable.submittedAt,
        })
        .from(assignmentSubmissionsTable)
        .where(inArray(assignmentSubmissionsTable.assignmentId, assignmentIds))
    : [];

  const quizzes = await db
    .select({
      id: quizzesTable.id,
      title: quizzesTable.title,
      timeLimitMinutes: quizzesTable.timeLimitMinutes,
      createdAt: quizzesTable.createdAt,
    })
    .from(quizzesTable)
    .where(eq(quizzesTable.courseId, courseId))
    .orderBy(quizzesTable.createdAt);

  const quizIds = quizzes.map((q) => q.id);
  const quizAttempts = quizIds.length > 0
    ? await db
        .select({
          id: quizAttemptsTable.id,
          quizId: quizAttemptsTable.quizId,
          enrollmentId: quizAttemptsTable.enrollmentId,
          studentEmail: quizAttemptsTable.studentEmail,
          score: quizAttemptsTable.score,
          maxScore: quizAttemptsTable.maxScore,
          feedback: quizAttemptsTable.feedback,
          submittedAt: quizAttemptsTable.submittedAt,
        })
        .from(quizAttemptsTable)
        .where(inArray(quizAttemptsTable.quizId, quizIds))
    : [];

  res.json({ enrollments, assignments, submissions, quizzes, quizAttempts });
});

export default router;
