import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import multer from "multer";
import fs from "fs";
import path from "path";
// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { runConsensusDetection } from "../lib/detector";
import {
  ListDocumentsResponse,
  ListDocumentsResponseItem,
  GetDocumentParams,
  GetDocumentResponse,
  DeleteDocumentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: path.join(process.cwd(), 'uploads/') 
});

router.get("/documents", async (req, res): Promise<void> => {
  const { data: docs, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const result = await Promise.all(
    (docs || []).map(async (doc) => {
      const { data: stats } = await supabase
        .from("redactions")
        .select("status, id")
        .eq("document_id", doc.id);

      const counts = { pending: 0, confirmed: 0, rejected: 0, user_added: 0 };
      let total = 0;
      for (const s of (stats || [])) {
        const statusKey = s.status as keyof typeof counts;
        if (counts.hasOwnProperty(statusKey)) {
          counts[statusKey]++;
        }
        total++;
      }

      return ListDocumentsResponseItem.parse({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at ?? null,
        totalRedactions: total,
        pendingCount: counts.pending,
        confirmedCount: counts.confirmed,
        rejectedCount: counts.rejected,
        userAddedCount: counts.user_added,
      });
    })
  );

  res.json(ListDocumentsResponse.parse(result));
});

router.post("/documents", upload.single("file"), async (req, res): Promise<void> => {
  try {
    let title = "";
    let content = "";
    let fileObj: any = null;

    if (req.file) {
      // It's a file upload
      const file = req.file;
      title = file.originalname;
      const dataBuffer = fs.readFileSync(file.path);
      
      const ext = path.extname(title).toLowerCase();
      console.log("Upload ext:", ext, "mimetype:", file.mimetype);
      if (ext === ".docx" || file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        content = result.value;
      } else {
        const pdfData = await pdfParse(dataBuffer);
        content = pdfData.text;
      }
      
      fileObj = file;
    } else if (req.body.title && req.body.content) {
      // It's a JSON upload
      title = req.body.title;
      content = req.body.content;
    } else {
      res.status(400).json({ error: "Missing file or title/content in request" });
      return;
    }

    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({
        title,
        content,
        file_path: fileObj ? fileObj.path : null,
      })
      .select("*")
      .single();

    if (insertError || !doc) {
      res.status(500).json({ error: insertError?.message || "Failed to insert document" });
      return;
    }

    // Trigger background AI consensus detection
    runConsensusDetection(doc.id, content).catch((err) => {
      console.error("Background consensus detection failed:", err);
    });

    res.status(201).json({ id: doc.id });
  } catch (err: any) {
    console.error("Error processing document:", err);
    res.status(500).json({ error: "Failed to process document." });
  }
});

router.get("/documents/:id/file", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .select("file_path")
    .eq("id", params.data.id)
    .single();

  if (error || !doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  if (!doc.file_path) {
    res.status(404).json({ error: "Document has no file associated" });
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.sendFile(doc.file_path, (err) => {
    if (err) {
      console.error("Error serving file:", err);
      if (!res.headersSent) {
        res.status(500).end();
      }
    }
  });
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.data.id)
    .single();

  if (error || !doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const { data: redactions } = await supabase
    .from("redactions")
    .select("*")
    .eq("document_id", doc.id)
    .order("start_offset", { ascending: true });

  const result = GetDocumentResponse.parse({
    id: doc.id,
    title: doc.title,
    status: doc.status,
    content: doc.content,
    filePath: doc.file_path,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at ?? null,
    redactions: (redactions || []).map((r) => ({
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
    })),
  });

  res.json(result);
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", params.data.id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(204).end();
});

router.post("/documents/:id/complete", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .update({ status: "completed" })
    .eq("id", params.data.id)
    .select("*")
    .single();

  if (error || !doc) {
    res.status(500).json({ error: error?.message || "Failed to complete document" });
    return;
  }

  res.json(doc);
});
router.get("/documents/:id/summary", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { data: redactions, error } = await supabase
    .from("redactions")
    .select("*")
    .eq("document_id", params.data.id);

  if (error || !redactions) {
    res.status(500).json({ error: error?.message || "Failed to fetch redactions" });
    return;
  }

  const totalRedactions = redactions.length;
  const confirmedCount = redactions.filter((r: any) => r.status === "confirmed").length;
  const rejectedCount = redactions.filter((r: any) => r.status === "rejected").length;
  const userAddedCount = redactions.filter((r: any) => r.status === "user_added").length;
  const pendingCount = redactions.filter((r: any) => r.status === "pending").length;

  const riskScore = totalRedactions === 0 ? 0 : Math.round((pendingCount / totalRedactions) * 100);
  const completionPercent = totalRedactions === 0 ? 100 : Math.round(((confirmedCount + rejectedCount + userAddedCount) / totalRedactions) * 100);

  const categoryMap: Record<string, number> = {};
  for (const r of redactions) {
    if (r.category) {
      categoryMap[r.category] = (categoryMap[r.category] || 0) + 1;
    }
  }
  const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

  res.json({
    documentId: params.data.id,
    totalRedactions,
    confirmedCount,
    rejectedCount,
    userAddedCount,
    pendingCount,
    riskScore,
    completionPercent,
    categoryBreakdown
  });
});

export default router;
