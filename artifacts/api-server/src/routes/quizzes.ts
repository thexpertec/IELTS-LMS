import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, quizzesTable, quizQuestionsTable } from "@workspace/db";
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

  const quizzes = await db
    .select({
      id: quizzesTable.id,
      title: quizzesTable.title,
      description: quizzesTable.description,
      courseId: quizzesTable.courseId,
      timeLimitMinutes: quizzesTable.timeLimitMinutes,
      isPublished: quizzesTable.isPublished,
      createdAt: quizzesTable.createdAt,
      updatedAt: quizzesTable.updatedAt,
      questionCount: sql<number>`(select count(*) from quiz_questions where quiz_id = ${quizzesTable.id})::int`,
    })
    .from(quizzesTable)
    .where(parsed.data.courseId ? eq(quizzesTable.courseId, parsed.data.courseId) : undefined)
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
    courseId: parsed.data.courseId ?? null,
    timeLimitMinutes: parsed.data.timeLimitMinutes ?? null,
    isPublished: parsed.data.isPublished ?? false,
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
      ...(parsed.data.courseId !== undefined && { courseId: parsed.data.courseId }),
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

router.delete("/quizzes/:id/questions/:questionId", async (req, res): Promise<void> => {
  const params = DeleteQuizQuestionParams.safeParse({ id: req.params.id, questionId: req.params.questionId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.id, params.data.questionId));
  res.status(204).send();
});

export default router;
