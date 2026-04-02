import { Router, type IRouter } from "express";
import healthRouter from "./health";
import coursesRouter from "./courses";
import lessonsRouter from "./lessons";
import enrollmentsRouter from "./enrollments";
import progressRouter from "./progress";
import dashboardRouter from "./dashboard";
import studentRouter from "./student";
import quizzesRouter from "./quizzes";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(coursesRouter);
router.use(lessonsRouter);
router.use(enrollmentsRouter);
router.use(progressRouter);
router.use(dashboardRouter);
router.use(studentRouter);
router.use(quizzesRouter);
router.use(storageRouter);

export default router;
