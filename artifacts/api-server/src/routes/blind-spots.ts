import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const ParamsSchema = z.object({ id: z.string().uuid() });

router.get("/documents/:id/blind-spots", async (req, res): Promise<void> => {
  const params = ParamsSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid document id" });
    return;
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, content")
    .eq("id", params.data.id)
    .single();

  if (docError || !doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const { data: redactions, error: redError } = await supabase
    .from("redactions")
    .select("*")
    .eq("document_id", doc.id);

  if (redError) {
    res.status(500).json({ error: redError.message });
    return;
  }

  const confirmedTexts = Array.from(
    new Set(
      (redactions || [])
        .filter((r) => r.status === "confirmed" || r.status === "user_added")
        .map((r) => r.text)
    )
  );

  const blindSpots: Array<{ text: string; category: string; suggestedStart: number; suggestedEnd: number }> = [];

  for (const cText of confirmedTexts) {
    if (cText.length < 3) continue; // Skip very short strings

    // Find all occurrences of cText in document content
    let startIdx = doc.content.indexOf(cText);
    while (startIdx !== -1) {
      const endIdx = startIdx + cText.length;
      
      // Check if this occurrence is already covered by ANY existing redaction
      const isCovered = (redactions || []).some(r => {
        return (startIdx >= r.start_offset && startIdx < r.end_offset) ||
               (endIdx > r.start_offset && endIdx <= r.end_offset) ||
               (startIdx <= r.start_offset && endIdx >= r.end_offset);
      });

      if (!isCovered) {
        // Find the category from the confirmed redaction
        const sourceRedaction = (redactions || []).find(r => r.text === cText && (r.status === "confirmed" || r.status === "user_added"));
        blindSpots.push({
          text: cText,
          category: sourceRedaction?.category || "other",
          suggestedStart: startIdx,
          suggestedEnd: endIdx,
        });
      }

      startIdx = doc.content.indexOf(cText, startIdx + 1);
    }
  }

  res.json({ blindSpots });
});

export default router;
