import { Router, type IRouter } from "express";
import { eq, count, countDistinct, sql, avg } from "drizzle-orm";
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

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [courseStats] = await db
    .select({
      totalCourses: count(coursesTable.id),
      publishedCourses: sql<number>`COUNT(CASE WHEN ${coursesTable.isPublished} = true THEN 1 END)`,
    })
    .from(coursesTable);

  const [enrollmentStats] = await db
    .select({
      totalEnrollments: count(enrollmentsTable.id),
      activeEnrollments: sql<number>`COUNT(CASE WHEN ${enrollmentsTable.status} = 'active' THEN 1 END)`,
      completedEnrollments: sql<number>`COUNT(CASE WHEN ${enrollmentsTable.status} = 'completed' THEN 1 END)`,
      totalStudents: countDistinct(enrollmentsTable.studentEmail),
    })
    .from(enrollmentsTable);

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

  const recentEnrollments = await db
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

router.get("/dashboard/course-stats", async (_req, res): Promise<void> => {
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

router.get("/dashboard/enrollment-trend", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      date: sql<string>`DATE(${enrollmentsTable.enrolledAt})::text`,
      count: count(enrollmentsTable.id),
    })
    .from(enrollmentsTable)
    .where(sql`${enrollmentsTable.enrolledAt} >= NOW() - INTERVAL '30 days'`)
    .groupBy(sql`DATE(${enrollmentsTable.enrolledAt})`)
    .orderBy(sql`DATE(${enrollmentsTable.enrolledAt}) ASC`);

  const points = rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  res.json(GetDashboardEnrollmentTrendResponse.parse(points));
});

router.get("/dashboard/quiz-analytics", async (_req, res): Promise<void> => {
  const [attemptStats] = await db
    .select({
      totalAttempts: count(quizAttemptsTable.id),
      avgScore: avg(quizAttemptsTable.score),
    })
    .from(quizAttemptsTable);

  const [quizCount] = await db
    .select({ totalQuizzes: count(quizzesTable.id) })
    .from(quizzesTable);

  const totalAttempts = Number(attemptStats?.totalAttempts ?? 0);
  const avgScore = Number(attemptStats?.avgScore ?? 0);

  const passAttempts = await db
    .select({ c: count(quizAttemptsTable.id) })
    .from(quizAttemptsTable)
    .where(sql`${quizAttemptsTable.score} >= 60`);

  const passing = Number(passAttempts[0]?.c ?? 0);
  const passRate = totalAttempts > 0 ? Math.round((passing / totalAttempts) * 100) : 0;

  res.json(GetDashboardQuizAnalyticsResponse.parse({
    totalAttempts,
    avgScore: Math.round(avgScore * 10) / 10,
    passRate,
    totalQuizzes: Number(quizCount?.totalQuizzes ?? 0),
  }));
});

router.get("/dashboard/top-courses", async (_req, res): Promise<void> => {
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
