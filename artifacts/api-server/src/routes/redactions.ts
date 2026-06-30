import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, documentsTable, redactionsTable } from "@workspace/db";
import {
  ListRedactionsParams,
  CreateRedactionParams,
  CreateRedactionBody,
  UpdateRedactionParams,
  UpdateRedactionBody,
  DeleteRedactionParams,
  ListRedactionsResponse,
  CreateRedactionResponse,
  UpdateRedactionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatRedaction(r: typeof redactionsTable.$inferSelect) {
  return {
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
  };
}

router.get("/documents/:id/redactions", async (req, res): Promise<void> => {
  const params = ListRedactionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const redactions = await db
    .select()
    .from(redactionsTable)
    .where(eq(redactionsTable.documentId, params.data.id))
    .orderBy(redactionsTable.startOffset);

  res.json(ListRedactionsResponse.parse(redactions.map(formatRedaction)));
});

router.post("/documents/:id/redactions", async (req, res): Promise<void> => {
  const params = CreateRedactionParams.safeParse(req.params);
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

  const parsed = CreateRedactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [redaction] = await db
    .insert(redactionsTable)
    .values({
      documentId: params.data.id,
      startOffset: parsed.data.startOffset,
      endOffset: parsed.data.endOffset,
      text: parsed.data.text,
      category: parsed.data.category,
      confidence: 1.0,
      status: "user_added",
      source: "user",
      note: parsed.data.note ?? null,
    })
    .returning();

  res.status(201).json(CreateRedactionResponse.parse(formatRedaction(redaction)));
});

router.patch(
  "/documents/:id/redactions/:redactionId",
  async (req, res): Promise<void> => {
    const params = UpdateRedactionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateRedactionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const updateData: Partial<typeof redactionsTable.$inferInsert> = {};
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.note !== undefined) updateData.note = parsed.data.note;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;

    const [redaction] = await db
      .update(redactionsTable)
      .set(updateData)
      .where(
        and(
          eq(redactionsTable.id, params.data.redactionId),
          eq(redactionsTable.documentId, params.data.id),
        ),
      )
      .returning();

    if (!redaction) {
      res.status(404).json({ error: "Redaction not found" });
      return;
    }

    res.json(UpdateRedactionResponse.parse(formatRedaction(redaction)));
  },
);

router.delete(
  "/documents/:id/redactions/:redactionId",
  async (req, res): Promise<void> => {
    const params = DeleteRedactionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [redaction] = await db
      .delete(redactionsTable)
      .where(
        and(
          eq(redactionsTable.id, params.data.redactionId),
          eq(redactionsTable.documentId, params.data.id),
        ),
      )
      .returning();

    if (!redaction) {
      res.status(404).json({ error: "Redaction not found" });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;
