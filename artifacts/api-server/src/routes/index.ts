import { Router, type IRouter } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents";
import redactionsRouter from "./redactions";
import suspiciousRouter from "./suspicious";

const router: IRouter = Router();

router.use(healthRouter);
router.use(documentsRouter);
router.use(redactionsRouter);
router.use(suspiciousRouter);

export default router;
