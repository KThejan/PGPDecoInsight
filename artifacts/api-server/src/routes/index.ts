import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import operatorsRouter from "./operators";
import recordsRouter from "./records";
import settingsRouter from "./settings";
import shiftsRouter from "./shifts";
import rankingsRouter from "./rankings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(operatorsRouter);
router.use(recordsRouter);
router.use(settingsRouter);
router.use(shiftsRouter);
router.use(rankingsRouter);

export default router;
