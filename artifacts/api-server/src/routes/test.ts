import { Router } from "express";
import { supabase } from "../lib/supabase";
const router = Router();
router.get("/test", async (req, res) => {
  const { data: docs } = await supabase.from('documents').select('id, title, content').order('created_at', { ascending: false }).limit(1);
  const doc = docs[0];
  const { data: redactions } = await supabase.from('redactions').select('*').eq('document_id', doc.id).order('start_offset', { ascending: true });
  res.json({ docTitle: doc.title, redactionsCount: redactions.length, redactions: redactions.slice(0, 3) });
});
export default router;
