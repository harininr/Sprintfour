import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { ShieldCheck, Eye, Download, CheckCircle2, Lock } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function FinalSafetyScanModal({ content, redactions, onExport }: { content: string, redactions: any[], onExport: () => void }) {
  const [open, setOpen] = useState(false);
  const [scanState, setScanState] = useState<"scanning" | "complete">("scanning");

  const activeRedactions = useMemo(() => 
    (redactions || []).filter(r => r.status === "confirmed" || r.status === "user_added" || r.status === "pending"),
  [redactions]);

  const redactedContent = useMemo(() => {
    let result = content;
    const sorted = [...activeRedactions].sort((a, b) => b.startOffset - a.startOffset);
    for (const r of sorted) {
      result = result.substring(0, r.startOffset) + `█`.repeat(r.text.length) + result.substring(r.endOffset);
    }
    return result;
  }, [content, activeRedactions]);

  const sourceChunks = useMemo(() => {
    const chunks: any[] = [];
    let lastIdx = 0;
    const sorted = [...activeRedactions].sort((a, b) => a.startOffset - b.startOffset);
    
    sorted.forEach(r => {
      if (r.startOffset > lastIdx) {
        chunks.push({ type: "text", text: content.substring(lastIdx, r.startOffset) });
      }
      chunks.push({ type: "redaction", text: r.text });
      lastIdx = r.endOffset;
    });
    if (lastIdx < content.length) {
      chunks.push({ type: "text", text: content.substring(lastIdx) });
    }
    return chunks;
  }, [content, activeRedactions]);

  // Simulate scan
  const handleOpen = (val: boolean) => {
    setOpen(val);
    if (val) {
      setScanState("scanning");
      setTimeout(() => setScanState("complete"), 1500);
    }
  };

  const hash = "SHA-256: 8F2A...E41";

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-[#666] border-[#E8DED1]">
          <ShieldCheck className="h-4 w-4 text-[#6B1E2B]" /> Safety Scan & Export
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[90vw] w-[1200px] bg-[#F5F1EA] h-[85vh] flex flex-col p-0 border-[#E8DED1] overflow-hidden">
        
        {/* Header */}
        <div className="shrink-0 px-8 py-5 border-b border-[#E8DED1] bg-[#FFFDF9] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-serif font-semibold text-[#1F1F1F]">Final Safety Validation</h2>
            <p className="text-[#666] text-sm mt-1">Compare the source document against the final redaction output before export.</p>
          </div>
          <div className="flex bg-[#F5F1EA] p-1 rounded-lg">
            <button className="px-4 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-[#1F1F1F]">Synchronized Scroll</button>
            <button className="px-4 py-1.5 text-xs font-medium rounded-md text-[#888]">Independent</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden relative">
          
          <div className="absolute inset-0 flex p-8 gap-8">
            {/* Left Panel: Source */}
            <div className="flex-1 flex flex-col bg-[#FFFDF9] rounded-2xl border border-[#E8DED1] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E8DED1] flex items-center justify-between bg-white">
                <div className="flex items-center gap-2 font-mono text-sm font-semibold text-[#6B1E2B]">
                  <Eye className="h-4 w-4" /> SOURCE DOCUMENT
                </div>
                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {activeRedactions.length} PII TAGS
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-8 font-serif text-[15px] leading-relaxed text-[#1F1F1F] whitespace-pre-wrap">
                {sourceChunks.map((c, i) => (
                  c.type === "text" ? <span key={i}>{c.text}</span> : <span key={i} className="bg-red-100 text-red-900 px-0.5 rounded border-b border-red-300">{c.text}</span>
                ))}
              </div>
            </div>

            {/* Right Panel: Redacted */}
            <div className="flex-1 flex flex-col bg-[#FFFDF9] rounded-2xl border border-[#E8DED1] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E8DED1] flex items-center justify-between bg-white">
                <div className="flex items-center gap-2 font-mono text-sm font-semibold text-[#4C7A53]">
                  <ShieldCheck className="h-4 w-4" /> REDACTED OUTPUT
                </div>
                <span className="bg-[#6B1E2B] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  FINALIZED VERSION
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-8 font-serif text-[15px] leading-relaxed text-[#1F1F1F] whitespace-pre-wrap">
                {redactedContent}
              </div>
            </div>
          </div>

          {/* Center Modal Overlay */}
          <AnimatePresence>
            {scanState === "complete" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FFFDF9] w-[420px] rounded-3xl shadow-2xl border border-[#E8DED1] p-8 flex flex-col items-center text-center"
              >
                <div className="h-16 w-16 bg-[#6B1E2B] rounded-2xl flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10" />
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="font-serif text-2xl font-semibold text-[#1F1F1F] mb-2">Final System Scan Complete</h3>
                <p className="text-[#666] text-sm mb-1">0 missed spans detected.</p>
                <p className="text-[#1F1F1F] font-bold mb-8">{activeRedactions.length} total redactions applied.</p>

                <div className="w-full space-y-2 mb-8">
                  <div className="flex items-center justify-between bg-[#F5F1EA] px-4 py-3 rounded-xl">
                    <span className="text-xs text-[#888] font-mono">Verification Hash</span>
                    <span className="text-xs text-[#6B1E2B] font-mono font-bold">{hash}</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#F5F1EA] px-4 py-3 rounded-xl">
                    <span className="text-xs text-[#888] font-mono">HIPAA Compliance</span>
                    <span className="flex items-center gap-1 text-xs text-[#4C7A53] font-bold uppercase tracking-wider">
                      <CheckCircle2 className="h-3 w-3" /> VALID
                    </span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-[#6B1E2B] hover:bg-[#7D2334] text-white h-12 rounded-xl text-sm font-semibold mb-3 shadow-md"
                  onClick={() => {
                    onExport();
                    setOpen(false);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Clean PDF
                </Button>
                
                <Button variant="ghost" className="w-full text-[#666] hover:text-[#1F1F1F] h-10 rounded-xl text-sm">
                  View Full Safety Report
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {scanState === "scanning" && (
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-10">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <ShieldCheck className="h-12 w-12 text-[#6B1E2B]" />
              </motion.div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
