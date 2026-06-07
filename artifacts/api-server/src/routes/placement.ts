import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db, coursesTable, tenantsTable,
  placementAttemptsTable, courseAssignmentsTable,
  studentProfilesTable, enrollmentsTable,
} from "@workspace/db";
import type { ScoreRange, TenantSettings } from "@workspace/db/schema";

const router: IRouter = Router();

const DEFAULT_SCORE_RANGES: ScoreRange[] = [
  { min: 0, max: 20, level: "A2", label: "Elementary" },
  { min: 21, max: 40, level: "B1", label: "Pre-Intermediate" },
  { min: 41, max: 65, level: "B2", label: "Intermediate" },
  { min: 66, max: 80, level: "C1", label: "Upper-Intermediate" },
  { min: 81, max: 100, level: "C2", label: "Advanced/Proficiency" },
];

function computeLevel(score: number, ranges: ScoreRange[]): string {
  const sorted = [...ranges].sort((a, b) => a.min - b.min);
  for (const r of sorted) {
    if (score >= r.min && score <= r.max) return r.level;
  }
  return sorted[sorted.length - 1]?.level ?? "B2";
}

function getRecommendedCourseId(level: string, ranges: ScoreRange[]): number | undefined {
  return ranges.find((r) => r.level === level)?.courseId ?? undefined;
}

async function getTenantId(req: Parameters<Parameters<typeof router.get>[1]>[0]): Promise<number | null> {
  return (req.session as { tenantId?: number }).tenantId ?? null;
}

async function getTenantSettings(tenantId: number): Promise<TenantSettings | null> {
  const [t] = await db.select({ settings: tenantsTable.settings }).from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  return (t?.settings as TenantSettings | null) ?? null;
}

// ── GET /api/placement/settings ──────────────────────────
router.get("/placement/settings", async (req, res): Promise<void> => {
  const tenantId = await getTenantId(req);
  if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const settings = await getTenantSettings(tenantId);
  const scoreRanges = settings?.placement?.scoreRanges ?? DEFAULT_SCORE_RANGES;
  const requirePlacementTest = settings?.features?.requirePlacementTest ?? false;
  const courses = await db.select({ id: coursesTable.id, title: coursesTable.title })
    .from(coursesTable).where(eq(coursesTable.tenantId, tenantId));
  res.json({ requirePlacementTest, scoreRanges, courses });
});

// ── PUT /api/placement/settings ──────────────────────────
router.put("/placement/settings", async (req, res): Promise<void> => {
  const tenantId = await getTenantId(req);
  if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { scoreRanges, requirePlacementTest } = req.body as { scoreRanges: ScoreRange[]; requirePlacementTest: boolean };
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
  const existing = (tenant.settings ?? {}) as TenantSettings;
  const updated: TenantSettings = {
    ...existing,
    features: { ...existing.features, requirePlacementTest } as TenantSettings["features"],
    placement: { scoreRanges },
  };
  await db.update(tenantsTable).set({ settings: updated }).where(eq(tenantsTable.id, tenantId));
  res.json({ ok: true });
});

// ── POST /api/placement/attempt ───────────────────────────
// Student submits online test
router.post("/placement/attempt", async (req, res): Promise<void> => {
  const tenantId = await getTenantId(req);
  if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { email, score, source, notes } = req.body as { email: string; score: number; source?: string; notes?: string };
  if (!email || score === undefined) { res.status(400).json({ error: "email and score required" }); return; }
  const settings = await getTenantSettings(tenantId);
  const ranges = settings?.placement?.scoreRanges ?? DEFAULT_SCORE_RANGES;
  const level = computeLevel(score, ranges);
  const recommendedCourseId = getRecommendedCourseId(level, ranges);
  const [attempt] = await db.insert(placementAttemptsTable).values({
    studentEmail: email, tenantId, score, level, recommendedCourseId: recommendedCourseId ?? null,
    source: source ?? "online", notes: notes ?? null,
  }).returning();
  res.json(attempt);
});

// ── POST /api/placement/manual-score ─────────────────────
// Admin manually enters a score for a student
router.post("/placement/manual-score", async (req, res): Promise<void> => {
  const tenantId = await getTenantId(req);
  if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { email, score, notes } = req.body as { email: string; score: number; notes?: string };
  if (!email || score === undefined) { res.status(400).json({ error: "email and score required" }); return; }
  const settings = await getTenantSettings(tenantId);
  const ranges = settings?.placement?.scoreRanges ?? DEFAULT_SCORE_RANGES;
  const level = computeLevel(score, ranges);
  const recommendedCourseId = getRecommendedCourseId(level, ranges);
  const [attempt] = await db.insert(placementAttemptsTable).values({
    studentEmail: email, tenantId, score, level, recommendedCourseId: recommendedCourseId ?? null,
    source: "manual", notes: notes ?? null,
  }).returning();
  res.json(attempt);
});

// ── GET /api/placement/my-result?email= ──────────────────
// Student gets their latest placement result
router.get("/placement/my-result", async (req, res): Promise<void> => {
  const tenantId = await getTenantId(req);
  if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { email } = req.query as { email?: string };
  if (!email) { res.status(400).json({ error: "email required" }); return; }
  const [attempt] = await db.select().from(placementAttemptsTable)
    .where(and(eq(placementAttemptsTable.studentEmail, email), eq(placementAttemptsTable.tenantId, tenantId)))
    .orderBy(desc(placementAttemptsTable.takenAt)).limit(1);
  if (!attempt) { res.json(null); return; }
  const [assignment] = await db.select({ courseId: courseAssignmentsTable.courseId, courseTitle: coursesTable.title })
    .from(courseAssignmentsTable)
    .leftJoin(coursesTable, eq(courseAssignmentsTable.courseId, coursesTable.id))
    .where(and(eq(courseAssignmentsTable.studentEmail, email), eq(courseAssignmentsTable.tenantId, tenantId), eq(courseAssignmentsTable.isActive, true)))
    .orderBy(desc(courseAssignmentsTable.assignedAt)).limit(1);
  let recommendedCourseTitle: string | null = null;
  if (attempt.recommendedCourseId) {
    const [c] = await db.select({ title: coursesTable.title }).from(coursesTable).where(eq(coursesTable.id, attempt.recommendedCourseId)).limit(1);
    recommendedCourseTitle = c?.title ?? null;
  }
  res.json({ ...attempt, assignedCourseId: assignment?.courseId ?? null, assignedCourseTitle: assignment?.courseTitle ?? null, recommendedCourseTitle });
});

// ── GET /api/placement/attempts ───────────────────────────
// Admin: list all placement attempts
router.get("/placement/attempts", async (req, res): Promise<void> => {
  const tenantId = await getTenantId(req);
  if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(placementAttemptsTable)
    .where(eq(placementAttemptsTable.tenantId, tenantId))
    .orderBy(desc(placementAttemptsTable.takenAt));
  // enrich with assignments and recommended course titles
  const enriched = await Promise.all(rows.map(async (a) => {
    const assignments = await db.select({ courseId: courseAssignmentsTable.courseId, courseTitle: coursesTable.title, assignedAt: courseAssignmentsTable.assignedAt, assignmentType: courseAssignmentsTable.assignmentType })
      .from(courseAssignmentsTable)
      .leftJoin(coursesTable, eq(courseAssignmentsTable.courseId, coursesTable.id))
      .where(and(eq(courseAssignmentsTable.studentEmail, a.studentEmail), eq(courseAssignmentsTable.tenantId, tenantId), eq(courseAssignmentsTable.isActive, true)))
      .orderBy(desc(courseAssignmentsTable.assignedAt));
    let recommendedCourseTitle: string | null = null;
    if (a.recommendedCourseId) {
      const [c] = await db.select({ title: coursesTable.title }).from(coursesTable).where(eq(coursesTable.id, a.recommendedCourseId)).limit(1);
      recommendedCourseTitle = c?.title ?? null;
    }
    const [profile] = await db.select({ displayName: studentProfilesTable.displayName })
      .from(studentProfilesTable).where(eq(studentProfilesTable.email, a.studentEmail)).limit(1);
    return {
      ...a,
      studentName: profile?.displayName ?? a.studentEmail.split("@")[0],
      recommendedCourseTitle,
      assignedCourses: assignments.map((x) => ({ courseId: x.courseId, courseTitle: x.courseTitle ?? "", assignedAt: x.assignedAt })),
    };
  }));
  res.json(enriched);
});

// ── DELETE /api/placement/attempts/:id ───────────────────
router.delete("/placement/attempts/:id", async (req, res): Promise<void> => {
  const tenantId = await getTenantId(req);
  if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(req.params.id, 10);
  await db.delete(placementAttemptsTable)
    .where(and(eq(placementAttemptsTable.id, id), eq(placementAttemptsTable.tenantId, tenantId)));
  res.json({ ok: true });
});

// ── POST /api/placement/assign ────────────────────────────
// Admin assigns a course to a student
router.post("/placement/assign", async (req, res): Promise<void> => {
  const tenantId = await getTenantId(req);
  if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const user = (req.session as { user?: { email?: string } }).user;
  const assignedByEmail = user?.email ?? "admin";
  const { studentEmail, courseId, placementAttemptId, assignmentType, notes } = req.body as {
    studentEmail: string; courseId: number; placementAttemptId?: number; assignmentType?: string; notes?: string;
  };
  if (!studentEmail || !courseId) { res.status(400).json({ error: "studentEmail and courseId required" }); return; }
  // Prevent duplicate active assignment of the same course
  const [duplicate] = await db.select({ id: courseAssignmentsTable.id })
    .from(courseAssignmentsTable)
    .where(and(eq(courseAssignmentsTable.studentEmail, studentEmail), eq(courseAssignmentsTable.tenantId, tenantId), eq(courseAssignmentsTable.courseId, courseId), eq(courseAssignmentsTable.isActive, true)))
    .limit(1);
  if (duplicate) { res.status(409).json({ error: "Course already assigned to this student" }); return; }
  const [assignment] = await db.insert(courseAssignmentsTable).values({
    studentEmail, courseId, tenantId, placementAttemptId: placementAttemptId ?? null,
    assignedByEmail, assignmentType: assignmentType ?? "manual", notes: notes ?? null, isActive: true,
  }).returning();
  // Also enroll the student if not already enrolled
  const [existing] = await db.select({ id: enrollmentsTable.id })
    .from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.studentEmail, studentEmail), eq(enrollmentsTable.courseId, courseId)))
    .limit(1);
  if (!existing) {
    try {
      const [profile] = await db.select({ displayName: studentProfilesTable.displayName })
        .from(studentProfilesTable).where(eq(studentProfilesTable.email, studentEmail)).limit(1);
      await db.insert(enrollmentsTable).values({
        courseId, studentEmail,
        studentName: profile?.displayName ?? studentEmail.split("@")[0],
        status: "active", progressPercent: 0,
      });
    } catch { /* enrollment may already exist */ }
  }
  res.json(assignment);
});

// ── GET /api/placement/assignments ───────────────────────
router.get("/placement/assignments", async (req, res): Promise<void> => {
  const tenantId = await getTenantId(req);
  if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select({
    id: courseAssignmentsTable.id,
    studentEmail: courseAssignmentsTable.studentEmail,
    courseId: courseAssignmentsTable.courseId,
    courseTitle: coursesTable.title,
    assignedByEmail: courseAssignmentsTable.assignedByEmail,
    assignmentType: courseAssignmentsTable.assignmentType,
    notes: courseAssignmentsTable.notes,
    isActive: courseAssignmentsTable.isActive,
    assignedAt: courseAssignmentsTable.assignedAt,
  })
    .from(courseAssignmentsTable)
    .leftJoin(coursesTable, eq(courseAssignmentsTable.courseId, coursesTable.id))
    .where(and(eq(courseAssignmentsTable.tenantId, tenantId), eq(courseAssignmentsTable.isActive, true)))
    .orderBy(desc(courseAssignmentsTable.assignedAt));
  res.json(rows);
});

// ── DELETE /api/placement/assignments/:id ─────────────────
router.delete("/placement/assignments/:id", async (req, res): Promise<void> => {
  const tenantId = await getTenantId(req);
  if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const id = parseInt(req.params.id, 10);
  await db.update(courseAssignmentsTable)
    .set({ isActive: false })
    .where(and(eq(courseAssignmentsTable.id, id), eq(courseAssignmentsTable.tenantId, tenantId)));
  res.json({ ok: true });
});

// ── GET /api/placement/reports ────────────────────────────
router.get("/placement/reports", async (req, res): Promise<void> => {
  const tenantId = await getTenantId(req);
  if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const attempts = await db.select().from(placementAttemptsTable)
    .where(eq(placementAttemptsTable.tenantId, tenantId))
    .orderBy(desc(placementAttemptsTable.takenAt));
  const report = await Promise.all(attempts.map(async (a) => {
    const [assignment] = await db.select({ courseId: courseAssignmentsTable.courseId, courseTitle: coursesTable.title })
      .from(courseAssignmentsTable)
      .leftJoin(coursesTable, eq(courseAssignmentsTable.courseId, coursesTable.id))
      .where(and(eq(courseAssignmentsTable.studentEmail, a.studentEmail), eq(courseAssignmentsTable.tenantId, tenantId), eq(courseAssignmentsTable.isActive, true)))
      .orderBy(desc(courseAssignmentsTable.assignedAt)).limit(1);
    const [profile] = await db.select({ displayName: studentProfilesTable.displayName })
      .from(studentProfilesTable).where(eq(studentProfilesTable.email, a.studentEmail)).limit(1);
    let recommendedCourseTitle: string | null = null;
    if (a.recommendedCourseId) {
      const [c] = await db.select({ title: coursesTable.title }).from(coursesTable).where(eq(coursesTable.id, a.recommendedCourseId)).limit(1);
      recommendedCourseTitle = c?.title ?? null;
    }
    // Get enrollment progress for the assigned course
    let progressPercent = 0;
    let completionStatus = "Not Started";
    if (assignment?.courseId) {
      const [enr] = await db.select({ progressPercent: enrollmentsTable.progressPercent, status: enrollmentsTable.status })
        .from(enrollmentsTable)
        .where(and(eq(enrollmentsTable.studentEmail, a.studentEmail), eq(enrollmentsTable.courseId, assignment.courseId)))
        .limit(1);
      progressPercent = enr?.progressPercent ?? 0;
      completionStatus = enr?.status === "completed" ? "Completed" : enr ? "In Progress" : "Not Started";
    }
    return {
      studentName: profile?.displayName ?? a.studentEmail.split("@")[0],
      studentEmail: a.studentEmail,
      placementScore: a.score,
      level: a.level,
      recommendedCourse: recommendedCourseTitle ?? "—",
      assignedCourse: assignment?.courseTitle ?? "Not Assigned",
      progressPercent,
      completionStatus,
      takenAt: a.takenAt,
    };
  }));
  res.json(report);
});

export default router;
