import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { z } from "zod";
import Groq from "groq-sdk";

const router: IRouter = Router();

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema = z.object({ question: z.string().min(1).max(2000) });

const SEVERITY_LABELS: Record<string, string> = {
  ssn: "Critical",
  financial: "Critical",
  medical: "High",
  phone: "High",
  dob: "High",
  address: "Medium",
  email: "Medium",
  name: "Low",
  organization: "Low",
  other: "Low",
};

function buildContext(doc: { title: string; content: string }, redactions: any[]): string {
  const pending = redactions.filter((r) => r.status === "pending");
  const confirmed = redactions.filter((r) => r.status === "confirmed");
  const rejected = redactions.filter((r) => r.status === "rejected");
  const userAdded = redactions.filter((r) => r.status === "user_added");

  const formatRedaction = (r: any) =>
    `- "${r.text}" [${r.category}, ${(r.confidence * 100).toFixed(0)}% confidence, severity: ${SEVERITY_LABELS[r.category] ?? "Low"}]`;

  const sections: string[] = [
    `=== DOCUMENT: ${doc.title} ===`,
    ``,
    `=== REVIEW STATISTICS ===`,
    `Total redactions: ${redactions.length}`,
    `Pending review: ${pending.length}`,
    `Confirmed (will be redacted): ${confirmed.length}`,
    `Rejected (false positives): ${rejected.length}`,
    `User-added (missed by AI): ${userAdded.length}`,
    ``,
    `=== PENDING REDACTIONS (NEED REVIEW) ===`,
    pending.length === 0
      ? "None — all items have been reviewed."
      : pending.map(formatRedaction).join("\n"),
    ``,
    `=== CONFIRMED REDACTIONS (WILL BE REDACTED) ===`,
    confirmed.length === 0
      ? "None confirmed yet."
      : confirmed.map(formatRedaction).join("\n"),
    ``,
    `=== REJECTED REDACTIONS (FALSE POSITIVES) ===`,
    rejected.length === 0
      ? "None rejected."
      : rejected.map(formatRedaction).join("\n"),
    ``,
    `=== USER-ADDED REDACTIONS (AI MISSED THESE) ===`,
    userAdded.length === 0
      ? "No user corrections made."
      : userAdded.map(formatRedaction).join("\n"),
    ``,
    `=== ORIGINAL DOCUMENT CONTENT ===`,
    doc.content.substring(0, 8000),
  ];

  return sections.join("\n");
}

router.post("/documents/:id/audit", async (req, res): Promise<void> => {
  if (!process.env.GROQ_API_KEY) {
    res.status(503).json({ error: "AI auditor not configured. Please add GROQ_API_KEY." });
    return;
  }

  const params = ParamsSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid document id" });
    return;
  }

  const body = BodySchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid question" });
    return;
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.data.id)
    .single();

  if (docError || !doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const { data: redactions } = await supabase
    .from("redactions")
    .select("*")
    .eq("document_id", doc.id)
    .order("start_offset", { ascending: true });

  const context = buildContext(doc, redactions || []);

  const systemPrompt = `You are a Privacy Auditor AI assistant embedded in a legal document redaction review platform.

CRITICAL RULES:
1. Answer ONLY using the document context provided below. Never invent or hallucinate information.
2. If you cannot find the answer in the provided context, say so clearly.
3. Be concise and professional. Legal reviewers are busy.
4. When listing items, be specific — include the exact text from the document.
5. Do not make assumptions about the document beyond what is provided.

CONTEXT:
${context}

You assist legal professionals in reviewing AI-generated redactions. Answer questions about:
- Which PII has been detected, confirmed, rejected, or missed
- Review completeness and safety
- Specific entity types (names, phones, emails, addresses, SSNs, etc.)
- Whether the document is safe to export or share
- Review statistics and patterns`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: body.data.question },
      ],
      stream: true,
      max_tokens: 1024,
      temperature: 0.1,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message ?? "AI error" })}\n\n`);
    res.end();
  }
});

export default router;
