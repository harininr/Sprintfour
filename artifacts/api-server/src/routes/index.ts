import { Router, type IRouter } from "express";
import healthRouter from "./health";
import uploadRouter from "./upload";
import documentsRouter from "./documents";
import redactionsRouter from "./redactions";
import suspiciousRouter from "./suspicious";
import intelligenceRouter from "./intelligence";
import auditRouter from "./audit";
import blindSpotsRouter from "./blind-spots";
import safetyScanRouter from "./safety-scan";
import exportRouter from "./export";
import auditorRouter from "./auditor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uploadRouter);
router.use(documentsRouter);
router.use(redactionsRouter);
router.use(suspiciousRouter);
router.use(intelligenceRouter);
router.use(auditRouter);
router.use(blindSpotsRouter);
router.use(safetyScanRouter);
router.use(exportRouter);
router.use(auditorRouter);

export default router;
