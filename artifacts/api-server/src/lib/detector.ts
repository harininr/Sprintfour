import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { supabase } from "@workspace/db";

const SYSTEM_PROMPT = `You are a Privacy Redaction AI. Extract Personally Identifiable Information (PII) from the given text.
Return ONLY a valid JSON array of objects, with NO markdown formatting or wrapping code blocks.
Each object MUST have the following schema:
{
  "text": "The exact substring extracted from the document",
  "category": "one of: name, phone, email, address, ssn, dob, financial, medical, organization, other"
}
If no PII is found, return an empty array [].
DO NOT extract generic nouns, common phrases, or non-sensitive information.
BE CONSERVATIVE.`;

export async function runConsensusDetection(documentId: string, content: string) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!geminiApiKey || !groqApiKey || !openRouterApiKey) {
    console.error("Missing AI API keys. Skipping detection.");
    return;
  }

  const aiGemini = new GoogleGenAI({ apiKey: geminiApiKey });
  const aiGroq = new Groq({ apiKey: groqApiKey });
  const aiOpenRouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openRouterApiKey,
  });

  const promises = [
    // Model 1: Gemini 2.5 Flash
    (async () => {
      try {
        const response = await aiGemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: content,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });
        const text = response.text || "[]";
        return JSON.parse(text);
      } catch (e) {
        console.error("Gemini failed", e);
        return [];
      }
    })(),

    // Model 2: Llama 3.3 70B (Groq)
    (async () => {
      try {
        const response = await aiGroq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        });
        const text = response.choices[0]?.message?.content || "{}";
        let parsed = JSON.parse(text);
        if (!Array.isArray(parsed) && Array.isArray(parsed.pii)) {
          parsed = parsed.pii;
        } else if (!Array.isArray(parsed) && Array.isArray(parsed.redactions)) {
          parsed = parsed.redactions;
        } else if (!Array.isArray(parsed)) {
          parsed = Object.values(parsed).find(Array.isArray) || [];
        }
        return parsed;
      } catch (e) {
        console.error("Llama 3.3 failed", e);
        return [];
      }
    })(),

    // Model 3: OpenRouter (Claude 3 Haiku or similar fast model)
    (async () => {
      try {
        const response = await aiOpenRouter.chat.completions.create({
          model: "anthropic/claude-3-haiku",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content },
          ],
          temperature: 0.1,
        });
        const text = response.choices[0]?.message?.content || "[]";
        // Attempt to extract JSON if markdown wrapped
        const cleanText = text.replace(/```json|```/g, "").trim();
        let parsed = JSON.parse(cleanText);
        if (!Array.isArray(parsed) && Array.isArray(parsed.pii)) {
          parsed = parsed.pii;
        } else if (!Array.isArray(parsed) && Array.isArray(parsed.redactions)) {
          parsed = parsed.redactions;
        } else if (!Array.isArray(parsed)) {
          parsed = Object.values(parsed).find(Array.isArray) || [];
        }
        return parsed;
      } catch (e) {
        console.error("OpenRouter failed", e);
        return [];
      }
    })(),
  ];

  const results = await Promise.allSettled(promises);
  
  // Aggregate all items
  const allDetections: Array<{ text: string; category: string; modelIndex: number }> = [];
  results.forEach((res, index) => {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      for (const item of res.value) {
        if (item && item.text && typeof item.text === "string") {
          allDetections.push({
            text: item.text.trim(),
            category: item.category || "other",
            modelIndex: index,
          });
        }
      }
    }
  });

  // Calculate offsets and consensus
  const consensusMap = new Map<string, { count: number; category: string; startOffset: number; endOffset: number; models: Set<number> }>();

  for (const det of allDetections) {
    if (!det.text || det.text.length < 2) continue;
    
    let startOffset = content.indexOf(det.text);
    while (startOffset !== -1) {
      const endOffset = startOffset + det.text.length;
      const key = `${startOffset}-${endOffset}`;
      
      if (!consensusMap.has(key)) {
        consensusMap.set(key, { count: 0, category: det.category, startOffset, endOffset, models: new Set() });
      }
      const existing = consensusMap.get(key)!;
      if (!existing.models.has(det.modelIndex)) {
        existing.models.add(det.modelIndex);
        existing.count++;
      }
      
      startOffset = content.indexOf(det.text, startOffset + 1);
    }
  }

  // Insert into DB
  const insertions = [];
  for (const [key, data] of consensusMap.entries()) {
    const conf = data.count / 3;
    const isDisputed = data.count === 1;
    
    insertions.push({
      document_id: documentId,
      start_offset: data.startOffset,
      end_offset: data.endOffset,
      text: content.substring(data.startOffset, data.endOffset),
      category: data.category,
      confidence: conf,
      status: "pending",
      source: "ai",
      note: JSON.stringify({
        message: isDisputed ? "Needs Second Opinion" : `Consensus: ${data.count}/3 models`,
        count: data.count,
        models: Array.from(data.models),
        isIgnored: false,
      }),
    });
  }

  if (insertions.length > 0) {
    const uniqueInsertions = Array.from(new Map(insertions.map(item => [`${item.start_offset}-${item.end_offset}`, item])).values());
    
    const { error } = await supabase.from("redactions").insert(uniqueInsertions);
    if (error) {
      console.error("Failed to insert consensus redactions", error);
    }
  }
}
