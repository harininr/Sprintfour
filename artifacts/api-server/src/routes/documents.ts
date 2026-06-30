import { Router, type IRouter } from "express";
import { eq, count, and, sql } from "drizzle-orm";
import { db, documentsTable, redactionsTable } from "@workspace/db";
import {
  GetDocumentParams,
  DeleteDocumentParams,
  GetDocumentSummaryParams,
  CompleteReviewParams,
  CreateDocumentBody,
  CreateDocumentResponse,
  GetDocumentResponse,
  CompleteReviewResponse,
  GetDocumentSummaryResponse,
  ListDocumentsResponseItem,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const docs = await db.select().from(documentsTable).orderBy(documentsTable.createdAt);

  const result = await Promise.all(
    docs.map(async (doc) => {
      const stats = await db
        .select({
          status: redactionsTable.status,
          cnt: count(),
        })
        .from(redactionsTable)
        .where(eq(redactionsTable.documentId, doc.id))
        .groupBy(redactionsTable.status);

      const counts = { pending: 0, confirmed: 0, rejected: 0, user_added: 0 };
      let total = 0;
      for (const s of stats) {
        const c = Number(s.cnt);
        counts[s.status as keyof typeof counts] = c;
        total += c;
      }

      return ListDocumentsResponseItem.parse({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt?.toISOString() ?? null,
        totalRedactions: total,
        pendingCount: counts.pending,
        confirmedCount: counts.confirmed,
        rejectedCount: counts.rejected,
        userAddedCount: counts.user_added,
      });
    }),
  );

  res.json(result);
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doc] = await db
    .insert(documentsTable)
    .values({ title: parsed.data.title, content: parsed.data.content })
    .returning();

  res.status(201).json(
    CreateDocumentResponse.parse({
      id: doc.id,
      title: doc.title,
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt?.toISOString() ?? null,
      totalRedactions: 0,
      pendingCount: 0,
      confirmedCount: 0,
      rejectedCount: 0,
      userAddedCount: 0,
    }),
  );
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, params.data.id));

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  if (doc.status === "pending") {
    await db
      .update(documentsTable)
      .set({ status: "in_review" })
      .where(eq(documentsTable.id, doc.id));
    doc.status = "in_review";
  }

  const redactions = await db
    .select()
    .from(redactionsTable)
    .where(eq(redactionsTable.documentId, doc.id))
    .orderBy(redactionsTable.startOffset);

  res.json(
    GetDocumentResponse.parse({
      id: doc.id,
      title: doc.title,
      status: doc.status,
      content: doc.content,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt?.toISOString() ?? null,
      redactions: redactions.map((r) => ({
        id: r.id,
        documentId: r.documentId,
        startOffset: r.startOffset,
        endOffset: r.endOffset,
        text: r.text,
        category: r.category,
        confidence: r.confidence,
        status: r.status,
        source: r.source,
        note: r.note ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt?.toISOString() ?? null,
      })),
    }),
  );
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .delete(documentsTable)
    .where(eq(documentsTable.id, params.data.id))
    .returning();

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/documents/:id/summary", async (req, res): Promise<void> => {
  const params = GetDocumentSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, params.data.id));

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const stats = await db
    .select({
      status: redactionsTable.status,
      cnt: count(),
    })
    .from(redactionsTable)
    .where(eq(redactionsTable.documentId, params.data.id))
    .groupBy(redactionsTable.status);

  const catStats = await db
    .select({
      category: redactionsTable.category,
      cnt: count(),
    })
    .from(redactionsTable)
    .where(
      and(
        eq(redactionsTable.documentId, params.data.id),
        sql`${redactionsTable.status} != 'rejected'`,
      ),
    )
    .groupBy(redactionsTable.category);

  const counts = { pending: 0, confirmed: 0, rejected: 0, user_added: 0 };
  let total = 0;
  for (const s of stats) {
    const c = Number(s.cnt);
    counts[s.status as keyof typeof counts] = c;
    total += c;
  }

  const reviewed = counts.confirmed + counts.rejected + counts.user_added;
  const completionPercent = total === 0 ? 100 : Math.round((reviewed / total) * 100);
  const riskScore = Math.min(
    100,
    counts.pending * 5 + counts.user_added * 15 + counts.confirmed * 2,
  );

  res.json(
    GetDocumentSummaryResponse.parse({
      documentId: params.data.id,
      totalRedactions: total,
      confirmedCount: counts.confirmed,
      rejectedCount: counts.rejected,
      userAddedCount: counts.user_added,
      pendingCount: counts.pending,
      riskScore,
      completionPercent,
      categoryBreakdown: catStats.map((s) => ({
        category: s.category,
        count: Number(s.cnt),
      })),
    }),
  );
});

router.post("/documents/:id/complete", async (req, res): Promise<void> => {
  const params = CompleteReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .update(documentsTable)
    .set({ status: "completed" })
    .where(eq(documentsTable.id, params.data.id))
    .returning();

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const stats = await db
    .select({ status: redactionsTable.status, cnt: count() })
    .from(redactionsTable)
    .where(eq(redactionsTable.documentId, doc.id))
    .groupBy(redactionsTable.status);

  const counts = { pending: 0, confirmed: 0, rejected: 0, user_added: 0 };
  let total = 0;
  for (const s of stats) {
    const c = Number(s.cnt);
    counts[s.status as keyof typeof counts] = c;
    total += c;
  }

  res.json(
    CompleteReviewResponse.parse({
      id: doc.id,
      title: doc.title,
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt?.toISOString() ?? null,
      totalRedactions: total,
      pendingCount: counts.pending,
      confirmedCount: counts.confirmed,
      rejectedCount: counts.rejected,
      userAddedCount: counts.user_added,
    }),
  );
});

export default router;
