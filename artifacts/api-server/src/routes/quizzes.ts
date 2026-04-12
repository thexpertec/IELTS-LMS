import { Router, type IRouter } from "express";
import { eq, sql, and, isNotNull } from "drizzle-orm";
import { db, quizzesTable, quizQuestionsTable, quizAttemptsTable, enrollmentsTable, coursesTable } from "@workspace/db";
import {
  ListQuizzesQueryParams,
  CreateQuizBody,
  GetQuizParams,
  UpdateQuizParams,
  UpdateQuizBody,
  DeleteQuizParams,
  AddQuizQuestionParams,
  AddQuizQuestionBody,
  UpdateQuizQuestionParams,
  UpdateQuizQuestionBody,
  DeleteQuizQuestionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/quizzes", async (req, res): Promise<void> => {
  const parsed = ListQuizzesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const tenantId = req.session.tenantId ?? null;
  const conditions = [];
  if (parsed.data.courseId) conditions.push(eq(quizzesTable.courseId, parsed.data.courseId));
  if (tenantId) conditions.push(eq(quizzesTable.tenantId, tenantId));

  const quizzes = await db
    .select({
      id: quizzesTable.id,
      title: quizzesTable.title,
      description: quizzesTable.description,
      courseId: quizzesTable.courseId,
      chapterId: quizzesTable.chapterId,
      lessonId: quizzesTable.lessonId,
      lessonType: quizzesTable.lessonType,
      timeLimitMinutes: quizzesTable.timeLimitMinutes,
      isPublished: quizzesTable.isPublished,
      tenantId: quizzesTable.tenantId,
      createdAt: quizzesTable.createdAt,
      updatedAt: quizzesTable.updatedAt,
      questionCount: sql<number>`(select coalesce(sum(case when type = 'matching' then jsonb_array_length(options->'leftItems') else 1 end)::int, 0) from quiz_questions where quiz_id = ${quizzesTable.id})`,
    })
    .from(quizzesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(quizzesTable.createdAt);

  res.json(quizzes);
});

router.post("/quizzes", async (req, res): Promise<void> => {
  const parsed = CreateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [quiz] = await db.insert(quizzesTable).values({
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    passageText: parsed.data.passageText ?? null,
    parts: parsed.data.parts ?? null,
    courseId: parsed.data.courseId ?? null,
    chapterId: parsed.data.chapterId ?? null,
    lessonId: parsed.data.lessonId ?? null,
    lessonType: parsed.data.lessonType ?? null,
    timeLimitMinutes: parsed.data.timeLimitMinutes ?? null,
    isPublished: parsed.data.isPublished ?? false,
    tenantId: req.session.tenantId ?? null,
  }).returning();

  res.status(201).json({ ...quiz, questionCount: 0 });
});

router.get("/quizzes/:id", async (req, res): Promise<void> => {
  const params = GetQuizParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, params.data.id));
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }

  const questions = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, params.data.id))
    .orderBy(quizQuestionsTable.order);

  res.json({ ...quiz, questions });
});

router.put("/quizzes/:id", async (req, res): Promise<void> => {
  const params = UpdateQuizParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [quiz] = await db
    .update(quizzesTable)
    .set({
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.passageText !== undefined && { passageText: parsed.data.passageText || null }),
      ...(parsed.data.parts !== undefined && { parts: parsed.data.parts ?? null }),
      ...(parsed.data.courseId !== undefined && { courseId: parsed.data.courseId }),
      ...(parsed.data.chapterId !== undefined && { chapterId: parsed.data.chapterId }),
      ...(parsed.data.lessonId !== undefined && { lessonId: parsed.data.lessonId }),
      ...(parsed.data.lessonType !== undefined && { lessonType: parsed.data.lessonType }),
      ...(parsed.data.timeLimitMinutes !== undefined && { timeLimitMinutes: parsed.data.timeLimitMinutes }),
      ...(parsed.data.isPublished !== undefined && { isPublished: parsed.data.isPublished }),
    })
    .where(eq(quizzesTable.id, params.data.id))
    .returning();

  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }

  const questionCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, quiz.id));

  res.json({ ...quiz, questionCount: questionCount[0]?.count ?? 0 });
});

router.delete("/quizzes/:id", async (req, res): Promise<void> => {
  const params = DeleteQuizParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(quizzesTable).where(eq(quizzesTable.id, params.data.id));
  res.status(204).send();
});

router.post("/quizzes/:id/questions", async (req, res): Promise<void> => {
  const params = AddQuizQuestionParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddQuizQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, params.data.id));

  const nextOrder = (countResult[0]?.count ?? 0) + 1;

  const [question] = await db.insert(quizQuestionsTable).values({
    quizId: params.data.id,
    type: parsed.data.type,
    order: parsed.data.order ?? nextOrder,
    questionText: parsed.data.questionText,
    options: parsed.data.options as Record<string, unknown>,
  }).returning();

  res.status(201).json(question);
});

router.put("/quizzes/:id/questions/:questionId", async (req, res): Promise<void> => {
  const params = UpdateQuizQuestionParams.safeParse({ id: req.params.id, questionId: req.params.questionId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateQuizQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [question] = await db
    .update(quizQuestionsTable)
    .set({
      ...(parsed.data.type !== undefined && { type: parsed.data.type }),
      ...(parsed.data.order !== undefined && { order: parsed.data.order }),
      ...(parsed.data.questionText !== undefined && { questionText: parsed.data.questionText }),
      ...(parsed.data.options !== undefined && { options: parsed.data.options as Record<string, unknown> }),
    })
    .where(eq(quizQuestionsTable.id, params.data.questionId))
    .returning();

  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  res.json(question);
});

router.patch("/quizzes/:id/questions/reorder", async (req, res): Promise<void> => {
  const quizId = Number(req.params.id);
  if (isNaN(quizId)) { res.status(400).json({ error: "Invalid quiz id" }); return; }

  const { orderedIds } = req.body as { orderedIds: number[] };
  if (!Array.isArray(orderedIds) || orderedIds.some((x) => typeof x !== "number")) {
    res.status(400).json({ error: "orderedIds must be an array of numbers" });
    return;
  }

  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(quizQuestionsTable)
        .set({ order: i + 1 })
        .where(eq(quizQuestionsTable.id, orderedIds[i]));
    }
  });

  res.json({ ok: true });
});

router.delete("/quizzes/:id/questions/:questionId", async (req, res): Promise<void> => {
  const params = DeleteQuizQuestionParams.safeParse({ id: req.params.id, questionId: req.params.questionId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.id, params.data.questionId));
  res.status(204).send();
});

// ── Quiz grade (upsert attempt score — used by admin/gradebook) ─────────────
router.put("/quizzes/:id/grade", async (req, res): Promise<void> => {
  const quizId = Number(req.params.id);
  if (!quizId) { res.status(400).json({ error: "Invalid quiz id" }); return; }

  const { enrollmentId, studentEmail, score, maxScore, feedback } = req.body;
  if (!enrollmentId || !studentEmail) {
    res.status(400).json({ error: "enrollmentId and studentEmail are required" });
    return;
  }

  const existing = await db
    .select({ id: quizAttemptsTable.id })
    .from(quizAttemptsTable)
    .where(and(
      eq(quizAttemptsTable.quizId, quizId),
      eq(quizAttemptsTable.enrollmentId, Number(enrollmentId))
    ))
    .limit(1);

  if (existing.length > 0) {
    const update: Record<string, unknown> = {};
    if (score !== undefined) update.score = score === null ? null : Number(score);
    if (maxScore !== undefined) update.maxScore = Number(maxScore);
    if (feedback !== undefined) update.feedback = feedback;
    const [row] = await db
      .update(quizAttemptsTable)
      .set(update)
      .where(eq(quizAttemptsTable.id, existing[0].id))
      .returning();
    res.json(row);
  } else {
    const [row] = await db
      .insert(quizAttemptsTable)
      .values({
        quizId,
        enrollmentId: Number(enrollmentId),
        studentEmail,
        score: score !== undefined && score !== null ? Number(score) : null,
        maxScore: maxScore ? Number(maxScore) : 100,
        feedback: feedback ?? null,
      })
      .returning();
    res.json(row);
  }
});

// ── Student quiz submission (stores answers) ──────────────────────────────────
router.post("/quizzes/:id/submit", async (req, res): Promise<void> => {
  const quizId = Number(req.params.id);
  if (!quizId) { res.status(400).json({ error: "Invalid quiz id" }); return; }

  const { studentName, studentEmail, enrollmentId, answers, totalSlots, answeredSlots } = req.body;
  if (!studentEmail) {
    res.status(400).json({ error: "studentEmail is required" });
    return;
  }

  // Try to resolve enrollmentId by email if not provided
  let resolvedEnrollmentId: number | null = enrollmentId ? Number(enrollmentId) : null;
  if (!resolvedEnrollmentId && studentEmail) {
    const quiz = await db.select({ courseId: quizzesTable.courseId }).from(quizzesTable).where(eq(quizzesTable.id, quizId)).limit(1);
    if (quiz[0]?.courseId) {
      const enr = await db.select({ id: enrollmentsTable.id })
        .from(enrollmentsTable)
        .where(and(
          eq(enrollmentsTable.courseId, quiz[0].courseId),
          eq(enrollmentsTable.studentEmail, studentEmail),
        ))
        .limit(1);
      if (enr[0]) resolvedEnrollmentId = enr[0].id;
    }
  }

  // Check for existing submission by email for this quiz
  const conditions = [eq(quizAttemptsTable.quizId, quizId), eq(quizAttemptsTable.studentEmail, studentEmail)];
  const existing = await db
    .select({ id: quizAttemptsTable.id })
    .from(quizAttemptsTable)
    .where(and(...conditions))
    .limit(1);

  if (existing.length > 0) {
    const [row] = await db
      .update(quizAttemptsTable)
      .set({
        studentName: studentName ?? null,
        answers: answers ?? null,
        totalSlots: totalSlots !== undefined ? Number(totalSlots) : null,
        answeredSlots: answeredSlots !== undefined ? Number(answeredSlots) : null,
        submittedAt: new Date(),
        ...(resolvedEnrollmentId && { enrollmentId: resolvedEnrollmentId }),
      })
      .where(eq(quizAttemptsTable.id, existing[0].id))
      .returning();
    res.json(row);
  } else {
    const [row] = await db
      .insert(quizAttemptsTable)
      .values({
        quizId,
        enrollmentId: resolvedEnrollmentId,
        studentEmail,
        studentName: studentName ?? null,
        answers: answers ?? null,
        totalSlots: totalSlots !== undefined ? Number(totalSlots) : null,
        answeredSlots: answeredSlots !== undefined ? Number(answeredSlots) : null,
      })
      .returning();
    res.json(row);
  }
});

// ── List all submissions for a quiz (admin) ────────────────────────────────────
router.get("/quizzes/:id/submissions", async (req, res): Promise<void> => {
  const quizId = Number(req.params.id);
  if (!quizId) { res.status(400).json({ error: "Invalid quiz id" }); return; }

  const submissions = await db
    .select({
      id: quizAttemptsTable.id,
      quizId: quizAttemptsTable.quizId,
      enrollmentId: quizAttemptsTable.enrollmentId,
      studentEmail: quizAttemptsTable.studentEmail,
      studentName: quizAttemptsTable.studentName,
      score: quizAttemptsTable.score,
      maxScore: quizAttemptsTable.maxScore,
      totalSlots: quizAttemptsTable.totalSlots,
      answeredSlots: quizAttemptsTable.answeredSlots,
      feedback: quizAttemptsTable.feedback,
      submittedAt: quizAttemptsTable.submittedAt,
    })
    .from(quizAttemptsTable)
    .where(eq(quizAttemptsTable.quizId, quizId))
    .orderBy(quizAttemptsTable.submittedAt);

  res.json(submissions);
});

// ── Get a single submission detail (admin — includes answers + questions) ──────
router.get("/quizzes/:id/submissions/:attemptId", async (req, res): Promise<void> => {
  const quizId = Number(req.params.id);
  const attemptId = Number(req.params.attemptId);
  if (!quizId || !attemptId) { res.status(400).json({ error: "Invalid id" }); return; }

  const [attempt] = await db
    .select()
    .from(quizAttemptsTable)
    .where(and(
      eq(quizAttemptsTable.id, attemptId),
      eq(quizAttemptsTable.quizId, quizId),
    ))
    .limit(1);

  if (!attempt) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  const questions = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, quizId))
    .orderBy(quizQuestionsTable.order);

  res.json({ ...attempt, questions });
});

// ── Update score/feedback on a specific submission (admin review) ──────────────
router.patch("/quizzes/:id/submissions/:attemptId", async (req, res): Promise<void> => {
  const quizId = Number(req.params.id);
  const attemptId = Number(req.params.attemptId);
  if (!quizId || !attemptId) { res.status(400).json({ error: "Invalid id" }); return; }

  const { score, feedback } = req.body;

  const update: Record<string, unknown> = {};
  if (score !== undefined) update.score = score === null ? null : Number(score);
  if (feedback !== undefined) update.feedback = feedback ?? null;

  const [row] = await db
    .update(quizAttemptsTable)
    .set(update)
    .where(and(
      eq(quizAttemptsTable.id, attemptId),
      eq(quizAttemptsTable.quizId, quizId),
    ))
    .returning();

  if (!row) { res.status(404).json({ error: "Submission not found" }); return; }
  res.json(row);
});

export default router;
