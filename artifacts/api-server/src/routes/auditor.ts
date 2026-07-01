import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

const router: IRouter = Router();

const AuditorBodySchema = z.object({
  documentId: z.string().uuid(),
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).default([]),
});

router.post("/auditor", async (req, res): Promise<void> => {
  const parsed = AuditorBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { documentId, message, history } = parsed.data;

  // Fetch document context
  const { data: doc } = await supabase.from("documents").select("*").eq("id", documentId).single();
  const { data: redactions } = await supabase.from("redactions").select("*").eq("document_id", documentId);

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    res.status(503).json({ error: "AI Assistant not configured." });
    return;
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const systemInstruction = `You are a strict Enterprise AI Privacy Auditor. 
Your job is to assist the reviewer of the following document.
Document Title: ${doc.title}
Document Status: ${doc.status}

Here is the document content:
<document>
${doc.content}
</document>

Here are the current redactions/detections:
${JSON.stringify((redactions || []).map(r => ({
    text: r.text,
    category: r.category,
    status: r.status,
    ai_confidence: r.confidence
  })), null, 2)}

You must answer the user's questions about privacy, remaining risks, AI consensus, and compliance.
Be concise, analytical, and prioritize trust and safety.`;

  try {
    const formattedHistory = history.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // Start chat session with system instruction
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction,
        temperature: 0.2,
      }
    });

    // We can't pre-load history easily in the new SDK without manually passing messages, 
    // but we can just append the history to the prompt if needed, or pass it in messages.
    // For simplicity with `@google/genai`, we just send the conversation as a big prompt, or use standard messages.

    let fullPrompt = "";
    for (const msg of history) {
      fullPrompt += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
    }
    fullPrompt += `USER: ${message}`;

    const response = await chat.sendMessage({ message: fullPrompt });

    res.json({
      role: "assistant",
      content: response.text || "I was unable to analyze that."
    });
  } catch (error: any) {
    console.error("Auditor failed:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
