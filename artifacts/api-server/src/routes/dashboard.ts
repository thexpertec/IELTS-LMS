import { Router, type IRouter } from "express";
import { eq, count, countDistinct, sql, avg, and, inArray, type SQL } from "drizzle-orm";
import { db, coursesTable, enrollmentsTable } from "@workspace/db";
import { quizAttemptsTable, quizzesTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetRecentActivityResponse,
  GetRecentActivityQueryParams,
  GetCourseStatsResponse,
  GetDashboardEnrollmentTrendResponse,
  GetDashboardQuizAnalyticsResponse,
  GetDashboardTopCoursesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getTenantCourseIds(tenantId: number | undefined): Promise<number[] | undefined> {
  if (!tenantId) return undefined;
  const rows = await db.select({ id: coursesTable.id }).from(coursesTable).where(eq(coursesTable.tenantId, tenantId));
  return rows.map((r) => r.id);
}

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const tenantId = req.session.tenantId;
  const courseWhere: SQL | undefined = tenantId ? eq(coursesTable.tenantId, tenantId) : undefined;

  const [courseStats] = await db
    .select({
      totalCourses: count(coursesTable.id),
      publishedCourses: sql<number>`COUNT(CASE WHEN ${coursesTable.isPublished} = true THEN 1 END)`,
    })
    .from(coursesTable)
    .where(courseWhere);

  const enrollmentQuery = db
    .select({
      totalEnrollments: count(enrollmentsTable.id),
      activeEnrollments: sql<number>`COUNT(CASE WHEN ${enrollmentsTable.status} = 'active' THEN 1 END)`,
      completedEnrollments: sql<number>`COUNT(CASE WHEN ${enrollmentsTable.status} = 'completed' THEN 1 END)`,
      totalStudents: countDistinct(enrollmentsTable.studentEmail),
    })
    .from(enrollmentsTable)
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id));

  const [enrollmentStats] = tenantId
    ? await enrollmentQuery.where(eq(coursesTable.tenantId, tenantId))
    : await enrollmentQuery;

  const total = Number(enrollmentStats.totalEnrollments);
  const completed = Number(enrollmentStats.completedEnrollments);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stats = {
    totalCourses: Number(courseStats.totalCourses),
    publishedCourses: Number(courseStats.publishedCourses),
    totalEnrollments: total,
    activeEnrollments: Number(enrollmentStats.activeEnrollments),
    completedEnrollments: completed,
    totalStudents: Number(enrollmentStats.totalStudents),
    completionRate,
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const params = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = params.success && params.data.limit ? params.data.limit : 10;
  const tenantId = req.session.tenantId;

  const query = db
    .select({
      id: enrollmentsTable.id,
      studentName: enrollmentsTable.studentName,
      courseName: coursesTable.title,
      occurredAt: enrollmentsTable.enrolledAt,
      status: enrollmentsTable.status,
    })
    .from(enrollmentsTable)
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .orderBy(sql`${enrollmentsTable.enrolledAt} DESC`)
    .limit(limit);

  const recentEnrollments = tenantId
    ? await query.where(eq(coursesTable.tenantId, tenantId))
    : await query;

  const activities = recentEnrollments.map((e, i) => ({
    id: i + 1,
    type: e.status === "completed" ? "completion" as const : "enrollment" as const,
    description: e.status === "completed"
      ? `Completed course`
      : `Enrolled in course`,
    studentName: e.studentName,
    courseName: e.courseName ?? "Unknown Course",
    occurredAt: e.occurredAt,
  }));

  res.json(GetRecentActivityResponse.parse(activities));
});

router.get("/dashboard/course-stats", async (req, res): Promise<void> => {
  const tenantId = req.session.tenantId;
  const courseWhere: SQL | undefined = tenantId ? eq(coursesTable.tenantId, tenantId) : undefined;

  const rows = await db
    .select({
      courseId: coursesTable.id,
      title: coursesTable.title,
      category: coursesTable.category,
      enrollmentCount: count(enrollmentsTable.id),
      completionCount: sql<number>`COUNT(CASE WHEN ${enrollmentsTable.status} = 'completed' THEN 1 END)`,
    })
    .from(coursesTable)
    .leftJoin(enrollmentsTable, eq(coursesTable.id, enrollmentsTable.courseId))
    .where(courseWhere)
    .groupBy(coursesTable.id, coursesTable.title, coursesTable.category)
    .orderBy(coursesTable.title);

  const stats = rows.map((r) => {
    const enrollmentCount = Number(r.enrollmentCount);
    const completionCount = Number(r.completionCount);
    const completionRate = enrollmentCount > 0 ? Math.round((completionCount / enrollmentCount) * 100) : 0;
    return {
      courseId: r.courseId,
      title: r.title,
      category: r.category,
      enrollmentCount,
      completionCount,
      completionRate,
    };
  });

  res.json(GetCourseStatsResponse.parse(stats));
});

router.get("/dashboard/enrollment-trend", async (req, res): Promise<void> => {
  const tenantId = req.session.tenantId;

  const baseWhere = sql`${enrollmentsTable.enrolledAt} >= NOW() - INTERVAL '30 days'`;
  const tenantWhere = tenantId ? eq(coursesTable.tenantId, tenantId) : undefined;

  const rows = await db
    .select({
      date: sql<string>`DATE(${enrollmentsTable.enrolledAt})::text`,
      count: count(enrollmentsTable.id),
    })
    .from(enrollmentsTable)
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .where(tenantWhere ? and(baseWhere, tenantWhere) : baseWhere)
    .groupBy(sql`DATE(${enrollmentsTable.enrolledAt})`)
    .orderBy(sql`DATE(${enrollmentsTable.enrolledAt}) ASC`);

  const points = rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  res.json(GetDashboardEnrollmentTrendResponse.parse(points));
});

router.get("/dashboard/quiz-analytics", async (req, res): Promise<void> => {
  const tenantId = req.session.tenantId;
  const courseIds = await getTenantCourseIds(tenantId);

  const quizWhere: SQL | undefined = courseIds ? inArray(quizzesTable.courseId, courseIds.length > 0 ? courseIds : [-1]) : undefined;

  const [quizCount] = await db
    .select({ totalQuizzes: count(quizzesTable.id) })
    .from(quizzesTable)
    .where(quizWhere);

  const quizIds = courseIds !== undefined
    ? (await db.select({ id: quizzesTable.id }).from(quizzesTable).where(quizWhere)).map((q) => q.id)
    : undefined;

  const attemptWhere: SQL | undefined = quizIds ? inArray(quizAttemptsTable.quizId, quizIds.length > 0 ? quizIds : [-1]) : undefined;

  const [attemptStats] = await db
    .select({
      totalAttempts: count(quizAttemptsTable.id),
      avgScore: avg(quizAttemptsTable.score),
    })
    .from(quizAttemptsTable)
    .where(attemptWhere);

  const totalAttempts = Number(attemptStats?.totalAttempts ?? 0);
  const avgScore = Number(attemptStats?.avgScore ?? 0);

  const passQuery = db
    .select({ c: count(quizAttemptsTable.id) })
    .from(quizAttemptsTable)
    .where(
      attemptWhere
        ? and(sql`${quizAttemptsTable.score} >= 60`, attemptWhere)
        : sql`${quizAttemptsTable.score} >= 60`
    );

  const passAttempts = await passQuery;
  const passing = Number(passAttempts[0]?.c ?? 0);
  const passRate = totalAttempts > 0 ? Math.round((passing / totalAttempts) * 100) : 0;

  res.json(GetDashboardQuizAnalyticsResponse.parse({
    totalAttempts,
    avgScore: Math.round(avgScore * 10) / 10,
    passRate,
    totalQuizzes: Number(quizCount?.totalQuizzes ?? 0),
  }));
});

router.get("/dashboard/top-courses", async (req, res): Promise<void> => {
  const tenantId = req.session.tenantId;
  const courseWhere: SQL | undefined = tenantId ? eq(coursesTable.tenantId, tenantId) : undefined;

  const rows = await db
    .select({
      courseId: coursesTable.id,
      title: coursesTable.title,
      category: coursesTable.category,
      instructor: coursesTable.instructor,
      isPublished: coursesTable.isPublished,
      enrollmentCount: count(enrollmentsTable.id),
      completionCount: sql<number>`COUNT(CASE WHEN ${enrollmentsTable.status} = 'completed' THEN 1 END)`,
      avgProgress: avg(enrollmentsTable.progressPercent),
    })
    .from(coursesTable)
    .leftJoin(enrollmentsTable, eq(coursesTable.id, enrollmentsTable.courseId))
    .where(courseWhere)
    .groupBy(coursesTable.id, coursesTable.title, coursesTable.category, coursesTable.instructor, coursesTable.isPublished)
    .orderBy(sql`COUNT(${enrollmentsTable.id}) DESC`)
    .limit(6);

  const topCourses = rows.map((r) => {
    const enrollmentCount = Number(r.enrollmentCount);
    const completionCount = Number(r.completionCount);
    return {
      courseId: r.courseId,
      title: r.title,
      category: r.category,
      instructor: r.instructor,
      isPublished: r.isPublished,
      enrollmentCount,
      completionRate: enrollmentCount > 0 ? Math.round((completionCount / enrollmentCount) * 100) : 0,
      avgProgress: Math.round(Number(r.avgProgress ?? 0)),
    };
  });

  res.json(GetDashboardTopCoursesResponse.parse(topCourses));
});

export default router;
