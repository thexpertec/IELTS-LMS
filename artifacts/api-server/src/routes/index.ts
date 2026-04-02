import { Router, type IRouter } from "express";
import healthRouter from "./health";
import coursesRouter from "./courses";
import lessonsRouter from "./lessons";
import enrollmentsRouter from "./enrollments";
import progressRouter from "./progress";
import dashboardRouter from "./dashboard";
import studentRouter from "./student";
import quizzesRouter from "./quizzes";
import assignmentsRouter from "./assignments";
import storageRouter from "./storage";
import chaptersRouter from "./chapters";
import streamRouter from "./stream";

const router: IRouter = Router();

router.use(healthRouter);
router.use(coursesRouter);
router.use(chaptersRouter);
router.use(lessonsRouter);
router.use(enrollmentsRouter);
router.use(progressRouter);
router.use(dashboardRouter);
router.use(studentRouter);
router.use(quizzesRouter);
router.use(assignmentsRouter);
router.use(storageRouter);
router.use(streamRouter);

export default router;
