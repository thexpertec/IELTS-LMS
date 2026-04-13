import { Router, type IRouter } from "express";
import { eq, and, ilike, type SQL } from "drizzle-orm";
import { db, enrollmentsTable, coursesTable } from "@workspace/db";
import {
  ListEnrollmentsResponse,
  CreateEnrollmentBody,
  GetEnrollmentParams,
  GetEnrollmentResponse,
  UpdateEnrollmentParams,
  UpdateEnrollmentBody,
  UpdateEnrollmentResponse,
  DeleteEnrollmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/enrollments", async (req, res): Promise<void> => {
  const { courseId, studentName } = req.query as { courseId?: string; studentName?: string };
  const tenantId = req.session.tenantId;

  const conditions: SQL[] = [];
  if (tenantId) conditions.push(eq(coursesTable.tenantId, tenantId));
  if (courseId) conditions.push(eq(enrollmentsTable.courseId, parseInt(courseId, 10)));
  if (studentName) conditions.push(ilike(enrollmentsTable.studentName, `%${studentName}%`));

  const rows = await db
    .select({
      id: enrollmentsTable.id,
      courseId: enrollmentsTable.courseId,
      studentName: enrollmentsTable.studentName,
      studentEmail: enrollmentsTable.studentEmail,
      status: enrollmentsTable.status,
      enrolledAt: enrollmentsTable.enrolledAt,
      completedAt: enrollmentsTable.completedAt,
      progressPercent: enrollmentsTable.progressPercent,
      courseName: coursesTable.title,
    })
    .from(enrollmentsTable)
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(enrollmentsTable.enrolledAt);

  res.json(ListEnrollmentsResponse.parse(rows));
});

router.post("/enrollments", async (req, res): Promise<void> => {
  const parsed = CreateEnrollmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select({ id: enrollmentsTable.id })
    .from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.courseId, parsed.data.courseId), eq(enrollmentsTable.studentEmail, parsed.data.studentEmail)))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "This student is already enrolled in this course" });
    return;
  }

  const [enrollment] = await db.insert(enrollmentsTable).values(parsed.data).returning();

  const [row] = await db
    .select({
      id: enrollmentsTable.id,
      courseId: enrollmentsTable.courseId,
      studentName: enrollmentsTable.studentName,
      studentEmail: enrollmentsTable.studentEmail,
      status: enrollmentsTable.status,
      enrolledAt: enrollmentsTable.enrolledAt,
      completedAt: enrollmentsTable.completedAt,
      progressPercent: enrollmentsTable.progressPercent,
      courseName: coursesTable.title,
    })
    .from(enrollmentsTable)
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .where(eq(enrollmentsTable.id, enrollment.id));

  res.status(201).json(GetEnrollmentResponse.parse(row));
});

router.get("/enrollments/:id", async (req, res): Promise<void> => {
  const params = GetEnrollmentParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: enrollmentsTable.id,
      courseId: enrollmentsTable.courseId,
      studentName: enrollmentsTable.studentName,
      studentEmail: enrollmentsTable.studentEmail,
      status: enrollmentsTable.status,
      enrolledAt: enrollmentsTable.enrolledAt,
      completedAt: enrollmentsTable.completedAt,
      progressPercent: enrollmentsTable.progressPercent,
      courseName: coursesTable.title,
    })
    .from(enrollmentsTable)
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .where(eq(enrollmentsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Enrollment not found" });
    return;
  }

  res.json(GetEnrollmentResponse.parse(row));
});

router.patch("/enrollments/:id", async (req, res): Promise<void> => {
  const params = UpdateEnrollmentParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEnrollmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "completed") {
    updateData.completedAt = new Date();
    updateData.progressPercent = 100;
  }

  const [enrollment] = await db
    .update(enrollmentsTable)
    .set(updateData)
    .where(eq(enrollmentsTable.id, params.data.id))
    .returning();

  if (!enrollment) {
    res.status(404).json({ error: "Enrollment not found" });
    return;
  }

  const [row] = await db
    .select({
      id: enrollmentsTable.id,
      courseId: enrollmentsTable.courseId,
      studentName: enrollmentsTable.studentName,
      studentEmail: enrollmentsTable.studentEmail,
      status: enrollmentsTable.status,
      enrolledAt: enrollmentsTable.enrolledAt,
      completedAt: enrollmentsTable.completedAt,
      progressPercent: enrollmentsTable.progressPercent,
      courseName: coursesTable.title,
    })
    .from(enrollmentsTable)
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .where(eq(enrollmentsTable.id, enrollment.id));

  res.json(UpdateEnrollmentResponse.parse(row));
});

router.delete("/enrollments/:id", async (req, res): Promise<void> => {
  const params = DeleteEnrollmentParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [enrollment] = await db.delete(enrollmentsTable).where(eq(enrollmentsTable.id, params.data.id)).returning();
  if (!enrollment) {
    res.status(404).json({ error: "Enrollment not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
