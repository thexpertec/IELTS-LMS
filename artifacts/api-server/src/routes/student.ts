import { Router, type IRouter } from "express";
import { eq, and, not, inArray, sql } from "drizzle-orm";
import {
  db,
  coursesTable,
  lessonsTable,
  chaptersTable,
  enrollmentsTable,
  lessonProgressTable,
  studentProfilesTable,
  assignmentsTable,
  assignmentSubmissionsTable,
  notificationsTable,
  discussionsTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/student/profile", async (req, res): Promise<void> => {
  const { email } = req.query as { email?: string };
  if (!email) {
    res.status(400).json({ error: "email query param required" });
    return;
  }

  let [profile] = await db
    .select()
    .from(studentProfilesTable)
    .where(eq(studentProfilesTable.email, email));

  if (!profile) {
    const [enrollment] = await db
      .select({ studentName: enrollmentsTable.studentName })
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.studentEmail, email))
      .limit(1);

    const displayName = enrollment?.studentName ?? email.split("@")[0];
    [profile] = await db
      .insert(studentProfilesTable)
      .values({ email, displayName })
      .returning();
  }

  res.json({
    email: profile.email,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl ?? undefined,
    createdAt: profile.createdAt.toISOString(),
  });
});

router.patch("/student/profile", async (req, res): Promise<void> => {
  const { email, displayName, bio, avatarUrl } = req.body as {
    email?: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  };

  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (bio !== undefined) updates.bio = bio;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const [profile] = await db
    .insert(studentProfilesTable)
    .values({ email, displayName: displayName ?? email.split("@")[0], bio: bio ?? "", avatarUrl })
    .onConflictDoUpdate({ target: studentProfilesTable.email, set: updates })
    .returning();

  res.json({
    email: profile.email,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl ?? undefined,
    createdAt: profile.createdAt.toISOString(),
  });
});

router.get("/student/my-enrollments", async (req, res): Promise<void> => {
  const { email } = req.query as { email?: string };
  if (!email) {
    res.status(400).json({ error: "email query param required" });
    return;
  }

  const rows = await db
    .select({
      id: enrollmentsTable.id,
      courseId: enrollmentsTable.courseId,
      courseTitle: coursesTable.title,
      courseDescription: coursesTable.description,
      courseCategory: coursesTable.category,
      instructor: coursesTable.instructor,
      status: enrollmentsTable.status,
      progressPercent: enrollmentsTable.progressPercent,
      enrolledAt: enrollmentsTable.enrolledAt,
    })
    .from(enrollmentsTable)
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .where(eq(enrollmentsTable.studentEmail, email))
    .orderBy(enrollmentsTable.enrolledAt);

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const [lessonCount] = await db
        .select({ total: sql<number>`COUNT(*)` })
        .from(lessonsTable)
        .where(eq(lessonsTable.courseId, row.courseId));

      const [completedCount] = await db
        .select({ completed: sql<number>`COUNT(*)` })
        .from(lessonProgressTable)
        .where(
          and(
            eq(lessonProgressTable.enrollmentId, row.id),
            eq(lessonProgressTable.completed, true)
          )
        );

      return {
        id: row.id,
        courseId: row.courseId,
        courseTitle: row.courseTitle ?? "",
        courseDescription: row.courseDescription ?? "",
        courseCategory: row.courseCategory ?? "",
        instructor: row.instructor ?? "",
        status: row.status as "active" | "completed" | "dropped",
        progressPercent: row.progressPercent,
        completedLessons: Number(completedCount.completed),
        totalLessons: Number(lessonCount.total),
        enrolledAt: row.enrolledAt.toISOString(),
      };
    })
  );

  res.json(enriched);
});

router.get("/student/available-courses", async (req, res): Promise<void> => {
  const { email } = req.query as { email?: string };
  if (!email) {
    res.status(400).json({ error: "email query param required" });
    return;
  }

  const enrolled = await db
    .select({ courseId: enrollmentsTable.courseId })
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.studentEmail, email));

  const enrolledIds = enrolled.map((e) => e.courseId);

  const courses = enrolledIds.length > 0
    ? await db
        .select()
        .from(coursesTable)
        .where(and(eq(coursesTable.isPublished, true), not(inArray(coursesTable.id, enrolledIds))))
    : await db.select().from(coursesTable).where(eq(coursesTable.isPublished, true));

  res.json(
    courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      instructor: c.instructor,
      isPublished: c.isPublished,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      thumbnailUrl: c.thumbnailUrl,
      durationHours: c.durationHours,
    }))
  );
});

router.post("/student/enroll", async (req, res): Promise<void> => {
  const { email, displayName, courseId } = req.body as {
    email?: string;
    displayName?: string;
    courseId?: number;
  };

  if (!email || !courseId) {
    res.status(400).json({ error: "email and courseId are required" });
    return;
  }

  const existing = await db
    .select()
    .from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.studentEmail, email), eq(enrollmentsTable.courseId, courseId)))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Already enrolled in this course" });
    return;
  }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  let [profile] = await db.select().from(studentProfilesTable).where(eq(studentProfilesTable.email, email)).limit(1);
  if (!profile && displayName) {
    [profile] = await db.insert(studentProfilesTable).values({ email, displayName }).returning();
  }

  const studentName = profile?.displayName ?? displayName ?? email.split("@")[0];

  const [enrollment] = await db
    .insert(enrollmentsTable)
    .values({ courseId, studentName, studentEmail: email, status: "active", progressPercent: 0 })
    .returning();

  await db.insert(notificationsTable).values({
    studentEmail: email,
    title: "Enrollment Confirmed",
    message: `You are now enrolled in "${course.title}". Start learning today!`,
    type: "success",
    isRead: false,
  });

  const [lessonCount] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(lessonsTable)
    .where(eq(lessonsTable.courseId, courseId));

  res.status(201).json({
    id: enrollment.id,
    courseId: enrollment.courseId,
    courseTitle: course.title,
    courseDescription: course.description,
    courseCategory: course.category,
    instructor: course.instructor,
    status: enrollment.status as "active" | "completed" | "dropped",
    progressPercent: enrollment.progressPercent,
    completedLessons: 0,
    totalLessons: Number(lessonCount.total),
    enrolledAt: enrollment.enrolledAt.toISOString(),
  });
});

router.get("/student/courses/:courseId", async (req, res): Promise<void> => {
  const courseId = parseInt(req.params.courseId, 10);
  const { email } = req.query as { email?: string };

  if (!email) {
    res.status(400).json({ error: "email query param required" });
    return;
  }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const [enrollment] = await db
    .select()
    .from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.courseId, courseId), eq(enrollmentsTable.studentEmail, email)))
    .limit(1);

  if (!enrollment) {
    res.status(404).json({ error: "Not enrolled in this course" });
    return;
  }

  const lessonRows = await db
    .select({
      id: lessonsTable.id,
      title: lessonsTable.title,
      content: lessonsTable.content,
      videoUrl: lessonsTable.videoUrl,
      durationMinutes: lessonsTable.durationMinutes,
      order: lessonsTable.order,
      chapterId: lessonsTable.chapterId,
      chapterTitle: chaptersTable.title,
    })
    .from(lessonsTable)
    .leftJoin(chaptersTable, eq(lessonsTable.chapterId, chaptersTable.id))
    .where(eq(lessonsTable.courseId, courseId))
    .orderBy(lessonsTable.order);

  const progressRows = await db
    .select()
    .from(lessonProgressTable)
    .where(eq(lessonProgressTable.enrollmentId, enrollment.id));

  const progressMap = new Map(progressRows.map((p) => [p.lessonId, p.completed]));

  res.json({
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    instructor: course.instructor,
    enrollmentId: enrollment.id,
    status: enrollment.status,
    progressPercent: enrollment.progressPercent,
    lessons: lessonRows.map((l) => ({
      id: l.id,
      title: l.title,
      content: l.content,
      duration: l.durationMinutes ?? 0,
      type: "lecture",
      chapterId: l.chapterId ?? null,
      chapterTitle: l.chapterTitle ?? null,
      isCompleted: progressMap.get(l.id) ?? false,
    })),
  });
});

router.post("/student/lessons/:lessonId/complete", async (req, res): Promise<void> => {
  const lessonId = parseInt(req.params.lessonId, 10);
  const { enrollmentId, completed } = req.body as { enrollmentId?: number; completed?: boolean };

  if (!enrollmentId || completed === undefined) {
    res.status(400).json({ error: "enrollmentId and completed are required" });
    return;
  }

  const existing = await db
    .select()
    .from(lessonProgressTable)
    .where(and(eq(lessonProgressTable.enrollmentId, enrollmentId), eq(lessonProgressTable.lessonId, lessonId)))
    .limit(1);

  let progress;
  if (existing.length > 0) {
    [progress] = await db
      .update(lessonProgressTable)
      .set({ completed, completedAt: completed ? new Date() : null })
      .where(and(eq(lessonProgressTable.enrollmentId, enrollmentId), eq(lessonProgressTable.lessonId, lessonId)))
      .returning();
  } else {
    [progress] = await db
      .insert(lessonProgressTable)
      .values({ enrollmentId, lessonId, completed, completedAt: completed ? new Date() : null })
      .returning();
  }

  const [enrollment] = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.id, enrollmentId)).limit(1);
  if (enrollment) {
    const [lessonCount] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(lessonsTable)
      .where(eq(lessonsTable.courseId, enrollment.courseId));

    const [completedCount] = await db
      .select({ completed: sql<number>`COUNT(*)` })
      .from(lessonProgressTable)
      .where(and(eq(lessonProgressTable.enrollmentId, enrollmentId), eq(lessonProgressTable.completed, true)));

    const total = Number(lessonCount.total);
    const done = Number(completedCount.completed);
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const newStatus = percent === 100 ? "completed" : "active";

    await db
      .update(enrollmentsTable)
      .set({ progressPercent: percent, status: newStatus, completedAt: newStatus === "completed" ? new Date() : null })
      .where(eq(enrollmentsTable.id, enrollmentId));
  }

  res.json({
    id: progress.id,
    enrollmentId: progress.enrollmentId,
    lessonId: progress.lessonId,
    completed: progress.completed,
    completedAt: progress.completedAt?.toISOString() ?? null,
  });
});

router.get("/student/notifications", async (req, res): Promise<void> => {
  const { email } = req.query as { email?: string };
  if (!email) {
    res.status(400).json({ error: "email query param required" });
    return;
  }

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.studentEmail, email))
    .orderBy(sql`${notificationsTable.createdAt} DESC`);

  res.json(
    rows.map((n) => ({
      id: n.id,
      studentEmail: n.studentEmail,
      title: n.title,
      message: n.message,
      type: n.type as "info" | "success" | "warning" | "announcement",
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }))
  );
});

router.patch("/student/notifications/read-all", async (req, res): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const rows = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.studentEmail, email), eq(notificationsTable.isRead, false)))
    .returning();

  res.json({ count: rows.length });
});

router.patch("/student/notifications/:id/read", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  const [notif] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id))
    .returning();

  if (!notif) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json({
    id: notif.id,
    studentEmail: notif.studentEmail,
    title: notif.title,
    message: notif.message,
    type: notif.type as "info" | "success" | "warning" | "announcement",
    isRead: notif.isRead,
    createdAt: notif.createdAt.toISOString(),
  });
});

router.get("/student/assignments", async (req, res): Promise<void> => {
  const { email } = req.query as { email?: string };
  if (!email) {
    res.status(400).json({ error: "email query param required" });
    return;
  }

  const enrollments = await db
    .select({ id: enrollmentsTable.id, courseId: enrollmentsTable.courseId })
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.studentEmail, email));

  if (enrollments.length === 0) {
    res.json([]);
    return;
  }

  const courseIds = enrollments.map((e) => e.courseId);
  const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, e.id]));

  const assignments = await db
    .select({
      id: assignmentsTable.id,
      courseId: assignmentsTable.courseId,
      courseTitle: coursesTable.title,
      title: assignmentsTable.title,
      description: assignmentsTable.description,
      type: assignmentsTable.type,
      dueDate: assignmentsTable.dueDate,
      maxScore: assignmentsTable.maxScore,
    })
    .from(assignmentsTable)
    .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id))
    .where(inArray(assignmentsTable.courseId, courseIds))
    .orderBy(assignmentsTable.dueDate);

  const withSubmissions = await Promise.all(
    assignments.map(async (a) => {
      const enrollmentId = enrollmentMap.get(a.courseId);
      let submission = null;

      if (enrollmentId) {
        const [sub] = await db
          .select()
          .from(assignmentSubmissionsTable)
          .where(
            and(
              eq(assignmentSubmissionsTable.assignmentId, a.id),
              eq(assignmentSubmissionsTable.enrollmentId, enrollmentId)
            )
          )
          .limit(1);

        if (sub) {
          submission = {
            id: sub.id,
            assignmentId: sub.assignmentId,
            content: sub.content,
            score: sub.score ?? undefined,
            feedback: sub.feedback ?? undefined,
            submittedAt: sub.submittedAt.toISOString(),
          };
        }
      }

      return {
        id: a.id,
        courseId: a.courseId,
        enrollmentId: enrollmentId ?? 0,
        courseTitle: a.courseTitle ?? "",
        title: a.title,
        description: a.description,
        type: a.type as "assignment" | "quiz",
        dueDate: a.dueDate.toISOString(),
        maxScore: a.maxScore,
        submission,
      };
    })
  );

  res.json(withSubmissions);
});

router.post("/student/assignments/:id/submit", async (req, res): Promise<void> => {
  const assignmentId = parseInt(req.params.id, 10);
  const { email, enrollmentId, content } = req.body as {
    email?: string;
    enrollmentId?: number;
    content?: string;
  };

  if (!email || !enrollmentId || !content) {
    res.status(400).json({ error: "email, enrollmentId, and content are required" });
    return;
  }

  const existing = await db
    .select()
    .from(assignmentSubmissionsTable)
    .where(
      and(
        eq(assignmentSubmissionsTable.assignmentId, assignmentId),
        eq(assignmentSubmissionsTable.enrollmentId, enrollmentId)
      )
    )
    .limit(1);

  let submission;
  if (existing.length > 0) {
    [submission] = await db
      .update(assignmentSubmissionsTable)
      .set({ content, submittedAt: new Date() })
      .where(eq(assignmentSubmissionsTable.id, existing[0].id))
      .returning();
  } else {
    [submission] = await db
      .insert(assignmentSubmissionsTable)
      .values({ assignmentId, enrollmentId, studentEmail: email, content })
      .returning();
  }

  res.json({
    id: submission.id,
    assignmentId: submission.assignmentId,
    content: submission.content,
    score: submission.score ?? undefined,
    feedback: submission.feedback ?? undefined,
    submittedAt: submission.submittedAt.toISOString(),
  });
});

router.get("/student/discussions", async (req, res): Promise<void> => {
  const { courseId } = req.query as { courseId?: string };
  if (!courseId) {
    res.status(400).json({ error: "courseId query param required" });
    return;
  }

  const rows = await db
    .select()
    .from(discussionsTable)
    .where(eq(discussionsTable.courseId, parseInt(courseId, 10)))
    .orderBy(sql`${discussionsTable.createdAt} ASC`);

  res.json(
    rows.map((d) => ({
      id: d.id,
      courseId: d.courseId,
      lessonId: d.lessonId ?? undefined,
      studentEmail: d.studentEmail,
      studentName: d.studentName,
      content: d.content,
      createdAt: d.createdAt.toISOString(),
    }))
  );
});

router.post("/student/discussions", async (req, res): Promise<void> => {
  const { courseId, lessonId, studentEmail, studentName, content } = req.body as {
    courseId?: number;
    lessonId?: number;
    studentEmail?: string;
    studentName?: string;
    content?: string;
  };

  if (!courseId || !studentEmail || !studentName || !content) {
    res.status(400).json({ error: "courseId, studentEmail, studentName, and content are required" });
    return;
  }

  const [discussion] = await db
    .insert(discussionsTable)
    .values({ courseId, lessonId, studentEmail, studentName, content })
    .returning();

  res.status(201).json({
    id: discussion.id,
    courseId: discussion.courseId,
    lessonId: discussion.lessonId ?? undefined,
    studentEmail: discussion.studentEmail,
    studentName: discussion.studentName,
    content: discussion.content,
    createdAt: discussion.createdAt.toISOString(),
  });
});

export default router;
