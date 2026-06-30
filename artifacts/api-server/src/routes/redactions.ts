import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
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

function formatRedaction(r: any) {
  return {
    id: r.id,
    documentId: r.document_id,
    startOffset: r.start_offset,
    endOffset: r.end_offset,
    boundingBoxes: r.bounding_boxes,
    text: r.text,
    category: r.category,
    confidence: r.confidence,
    status: r.status,
    source: r.source,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

router.get("/documents/:id/redactions", async (req, res): Promise<void> => {
  const params = ListRedactionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { data: redactions, error } = await supabase
    .from("redactions")
    .select("*")
    .eq("document_id", params.data.id)
    .order("start_offset", { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(ListRedactionsResponse.parse((redactions || []).map(formatRedaction)));
});

router.post("/documents/:id/redactions", async (req, res): Promise<void> => {
  const params = CreateRedactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id")
    .eq("id", params.data.id)
    .single();

  if (docError || !doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const parsed = CreateRedactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { data: redaction, error } = await supabase
    .from("redactions")
    .insert({
      document_id: params.data.id,
      start_offset: parsed.data.startOffset,
      end_offset: parsed.data.endOffset,
      bounding_boxes: parsed.data.boundingBoxes,
      text: parsed.data.text,
      category: parsed.data.category,
      confidence: 1.0,
      status: "user_added",
      source: "user",
      note: parsed.data.note || null,
    })
    .select("*")
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

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

    const updateData: any = {};
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.note !== undefined) updateData.note = parsed.data.note;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;

    const { data: redaction, error } = await supabase
      .from("redactions")
      .update(updateData)
      .eq("id", params.data.redactionId)
      .eq("document_id", params.data.id)
      .select("*")
      .single();

    if (error || !redaction) {
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

    const { data: redaction, error } = await supabase
      .from("redactions")
      .delete()
      .eq("id", params.data.redactionId)
      .eq("document_id", params.data.id)
      .select("*")
      .single();

    if (error || !redaction) {
      res.status(404).json({ error: "Redaction not found" });
      return;
    }

    res.sendStatus(204);
  },
);

router.patch("/documents/:id/redactions/boxes", async (req, res): Promise<void> => {
  const params = ListRedactionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const updates: Record<string, string> = req.body.boxes; // { redactionId: JSON_string }
  if (!updates || typeof updates !== 'object') {
    res.status(400).json({ error: "Invalid body format" });
    return;
  }

  try {
    for (const [id, boxesStr] of Object.entries(updates)) {
      await supabase
        .from("redactions")
        .update({ bounding_boxes: boxesStr })
        .eq("id", id)
        .eq("document_id", params.data.id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
