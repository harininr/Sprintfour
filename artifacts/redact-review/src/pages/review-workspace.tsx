import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetDocument,
  useCompleteReview,
  getGetDocumentQueryKey,
  useUpdateRedaction,
  useGetSuspiciousText,
  getGetSuspiciousTextQueryKey,
  useCreateRedaction,
  useDeleteRedaction,
  RedactionInputCategory,
  Redaction,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft, MousePointerSquareDashed, X, ShieldAlert, Undo2,
  AlertTriangle, Keyboard, LayoutPanelLeft, SplitSquareHorizontal,
  FileText, Check, Eye, Info, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { useReviewBehavior } from "@/hooks/useReviewBehavior";
import { AIAuditorWidget } from "@/components/AIAuditorWidget";

import {
  getSeverity, parseConsensus, isSecondOpinion, sortReviewQueue,
  SEVERITY_COLORS,
} from "@/lib/review-utils";

import { FinalSafetyScanModal } from "@/components/PreviewExportModal";
import { CompleteReviewModal } from "@/components/CompleteReviewModal";
import { ReviewSidebar } from "@/components/review/ReviewSidebar";
import { EntityDetailPanel } from "@/components/review/EntityDetailPanel";
import { RemainingRiskBanner } from "@/components/review/RemainingRiskBanner";
import { PDFViewer } from "@/components/review/PDFViewer";

type DocViewMode = "original" | "reviewed" | "export";

// Helper to build redacted content
function buildRedactedContent(content: string, redactions: any[], mode: DocViewMode): string {
  if (mode === "original") return content;
  const active = (redactions || []).filter(r =>
    mode === "export"
      ? (r.status === "confirmed" || r.status === "user_added")
      : r.status === "confirmed" || r.status === "user_added" || r.status === "rejected"
  );
  let result = content;
  const sorted = [...active].sort((a, b) => b.startOffset - a.startOffset);
  for (const r of sorted) {
    if (mode === "export") {
      result = result.slice(0, r.startOffset) + `[REDACTED ${r.category.toUpperCase()}]` + result.slice(r.endOffset);
    }
  }
  return result;
}

export default function ReviewWorkspace() {
  const params = useParams();
  const id = params.id as string;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: document, isLoading } = useGetDocument(id, {
    query: {
      enabled: !!id,
      queryKey: getGetDocumentQueryKey(id),
      refetchInterval: (query: any) =>
        query?.state?.data?.redactions?.length === 0 ? 2000 : false,
    },
  });
  const { data: suspiciousText } = useGetSuspiciousText(id, {
    query: { enabled: !!id, queryKey: getGetSuspiciousTextQueryKey(id) },
  });

  const completeMutation = useCompleteReview();
  const updateRedaction = useUpdateRedaction();
  const createRedaction = useCreateRedaction();
  const deleteRedaction = useDeleteRedaction();

  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "rejected" | "user">("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailPanelId, setDetailPanelId] = useState<string | null>(null);
  const [suspiciousDrawerOpen, setSuspiciousDrawerOpen] = useState(false);
  const [docViewMode, setDocViewMode] = useState<DocViewMode>("original");
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { recordAction, actions } = useReviewBehavior();
  const [undoStack, setUndoStack] = useState<{ id: string; prevStatus: string }[]>([]);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string; x: number; y: number; boundingBoxes?: string } | null>(null);
  const [newCategory, setNewCategory] = useState<RedactionInputCategory>("other");

  const handlePdfSelection = (sel: { text: string; x: number; y: number; boundingBoxes: string }) => {
    setSelection({
      start: 0,
      end: sel.text.length,
      text: sel.text,
      x: sel.x,
      y: sel.y,
      boundingBoxes: sel.boundingBoxes
    });
  };

  const redactions = useMemo(() => document?.redactions || [], [document]);

  const pendingRedactions = useMemo(
    () => sortReviewQueue(redactions.filter(r => r.status === "pending")),
    [redactions]
  );
  const confirmedRedactions = useMemo(() => redactions.filter(r => r.status === "confirmed"), [redactions]);
  const rejectedRedactions  = useMemo(() => redactions.filter(r => r.status === "rejected"), [redactions]);
  const userRedactions      = useMemo(() => redactions.filter(r => r.status === "user_added"), [redactions]);

  const totalReviewed = confirmedRedactions.length + rejectedRedactions.length + userRedactions.length;
  const totalItems = redactions.length;
  const progress = totalItems > 0 ? (totalReviewed / totalItems) * 100 : 100;

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleStatusChange = (redactionId: string, status: "confirmed" | "rejected" | "pending" | "ignored") => {
    const existing = redactions.find(r => r.id === redactionId);
    if (existing) setUndoStack(prev => [...prev, { id: redactionId, prevStatus: existing.status }]);
    if (status !== "pending") recordAction(redactionId, status as any);
    const apiStatus = status === "ignored" ? "rejected" : status;
    updateRedaction.mutate(
      { id, redactionId, data: { status: apiStatus as any } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) }) }
    );
  };

  const handleCategoryChange = (redactionId: string, category: string) => {
    updateRedaction.mutate(
      { id, redactionId, data: { category: category as any } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) }) }
    );
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    updateRedaction.mutate(
      { id, redactionId: last.id, data: { status: last.prevStatus as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
          toast.success("Action undone");
        },
      }
    );
  };

  const handleDelete = (redactionId: string) => {
    deleteRedaction.mutate(
      { id, redactionId },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) }) }
    );
  };

  // Opens confirmation modal — actual API call happens after user confirms
  const handleComplete = () => {
    setCompleteModalOpen(true);
  };

  const handleConfirmedComplete = () => {
    completeMutation.mutate(
      { id },
      { 
        onSuccess: () => { 
          setCompleteModalOpen(false); 
          setLocation(`/review/${id}/complete`); 
        },
        onError: (err) => {
          toast.error("Failed to complete review: " + err.message);
          console.error(err);
        }
      }
    );
  };

  const handleJump = (redactionId: string) => {
    setSelectedId(redactionId);
    window.document.getElementById(`doc-redaction-${redactionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    // Switch to pending tab if item is pending
    const r = redactions.find(x => x.id === redactionId);
    if (r?.status === "pending") setActiveTab("pending");
  };

  // ── Keyboard Shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "s" || e.key === "S") { setSuspiciousDrawerOpen(p => !p); return; }
      if (e.key === "?" || e.key === "/") { setShowShortcuts(p => !p); return; }
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) { handleUndo(); return; }

      if (pendingRedactions.length === 0) return;

      const currentIdx = pendingRedactions.findIndex(r => r.id === selectedId);

      // Navigate
      if (e.key === "n" || e.key === "N" || e.key === "j" || e.key === "J") {
        const next = currentIdx < pendingRedactions.length - 1 ? currentIdx + 1 : 0;
        const r = pendingRedactions[next];
        setSelectedId(r.id);
        window.document.getElementById(`doc-redaction-${r.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (e.key === "p" || e.key === "P" || e.key === "k" || e.key === "K") {
        const prev = currentIdx > 0 ? currentIdx - 1 : pendingRedactions.length - 1;
        const r = pendingRedactions[prev];
        setSelectedId(r.id);
        window.document.getElementById(`doc-redaction-${r.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (!selectedId) return;
      // Actions on selected
      if (e.key === "r" || e.key === "R") handleStatusChange(selectedId, "confirmed");
      if (e.key === "i" || e.key === "I") handleStatusChange(selectedId, "rejected");
      if (e.key === "e" || e.key === "E") setDetailPanelId(selectedId);
      if (e.key === " ") { e.preventDefault(); setDetailPanelId(p => p === selectedId ? null : selectedId); }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingRedactions, selectedId, id, undoStack]);

  // ── Manual Redaction ──────────────────────────────────────────────────────────
  const handleMouseUp = () => {
    if (docViewMode !== "original") return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !contentRef.current) return;
    const range = sel.getRangeAt(0);
    const pre = range.cloneRange();
    pre.selectNodeContents(contentRef.current);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const text = sel.toString();
    const rect = range.getBoundingClientRect();
    setSelection({ start, end: start + text.length, text, x: rect.left + rect.width / 2, y: rect.top - 10 });
  };

  const handleAddRedaction = () => {
    if (!selection) return;
    createRedaction.mutate(
      { 
        id, 
        data: { 
          startOffset: selection.start, 
          endOffset: selection.end, 
          text: selection.text, 
          category: newCategory,
          boundingBoxes: selection.boundingBoxes 
        } 
      },
      {
        onSuccess: () => {
          setSelection(null);
          window.getSelection()?.removeAllRanges();
          queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
        },
      }
    );
  };

  // ── Build Document Chunks ─────────────────────────────────────────────────────
  // Only highlight items from the sidebar (AI-detected redactions).
  // Suspicious/detection-engine spans are NOT highlighted in the document.
  const chunks = useMemo(() => {
    const result: { text: string; redaction?: Redaction; isNormal?: boolean; id: string }[] = [];
    if (!document?.content) return result;
    const markers = redactions.map(r => ({ ...r, type: "redaction" }));
    markers.sort((a, b) => a.startOffset - b.startOffset);

    let lastIdx = 0;
    markers.forEach(m => {
      if (m.startOffset > lastIdx) result.push({ text: document.content.substring(lastIdx, m.startOffset), isNormal: true, id: `norm-${lastIdx}` });
      result.push({ text: m.text, redaction: m, id: `red-${m.id}` });
      lastIdx = Math.max(lastIdx, m.endOffset);
    });
    if (lastIdx < document.content.length) result.push({ text: document.content.substring(lastIdx), isNormal: true, id: `norm-${lastIdx}` });
    return result;
  }, [document, redactions]);

  // ── Similar entity count ──────────────────────────────────────────────────────
  const getSimilarCount = (r: Redaction) => redactions.filter(x => x.text === r.text && x.id !== r.id).length;

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading || !document) return (
    <div className="h-screen flex items-center justify-center bg-[#F5F1EA]">
      <div className="flex flex-col items-center gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
          <ShieldAlert className="h-10 w-10 text-[#6B1E2B]" />
        </motion.div>
        <p className="font-serif text-xl text-[#1F1F1F]">Loading secure workspace…</p>
        <p className="text-sm text-[#888]">Preparing document and AI analysis.</p>
      </div>
    </div>
  );

  const detailRedaction = detailPanelId ? redactions.find(r => r.id === detailPanelId) : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden text-[#1F1F1F]" style={{ background: "#F5F1EA" }}>

      {/* ── Topbar ─────────────────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 bg-[#FFFDF9] border-b border-[#E8DED1] shadow-sm px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="text-[#666]">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-[#E8DED1]" />
          <h1 className="font-serif font-semibold text-[#1F1F1F] text-base truncate max-w-[180px]">{document.title}</h1>
        </div>

        {/* Center: Progress */}
        <div className="flex items-center gap-3 w-52">
          <div className="flex flex-col w-full gap-0.5">
            <div className="flex justify-between text-[10px] text-[#888] font-medium">
              <span>{totalReviewed} / {totalItems} reviewed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#E8DED1] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#6B1E2B] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">

          {/* View Mode Toggle */}
          <div className="flex bg-[#F5F1EA] border border-[#E8DED1] rounded-lg p-0.5 gap-0.5">
            {(["original", "reviewed", "export"] as DocViewMode[]).map(mode => {
              const icons = { original: <FileText className="h-3 w-3" />, reviewed: <Eye className="h-3 w-3" />, export: <SplitSquareHorizontal className="h-3 w-3" /> };
              const labels = { original: "Original", reviewed: "Reviewed", export: "Export" };
              return (
                <button
                  key={mode}
                  onClick={() => setDocViewMode(mode)}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
                    docViewMode === mode ? "bg-[#FFFDF9] shadow-sm text-[#1F1F1F]" : "text-[#888]"
                  }`}
                >
                  {icons[mode]} {labels[mode]}
                </button>
              );
            })}
          </div>

          {/* Keyboard hints */}
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-[#888] hover:text-[#1F1F1F]"
            onClick={() => setShowShortcuts(p => !p)}
          >
            <Keyboard className="h-4 w-4" />
          </Button>

          {/* Undo */}
          <Button
            variant="ghost" size="sm"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="text-[#888] hover:text-[#1F1F1F] gap-1.5 text-xs"
          >
            <Undo2 className="h-3.5 w-3.5" /> Undo
          </Button>

          {/* Complete */}
          <Button
            disabled={pendingRedactions.length > 0 || completeMutation.isPending}
            onClick={handleComplete}
            className="font-medium bg-[#6B1E2B] text-white hover:bg-[#7D2334] disabled:opacity-40 text-sm"
          >
            {completeMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Completing…
              </span>
            ) : "Complete Review"}
          </Button>
        </div>
      </header>

      {/* ── Risk Banner ───────────────────────────────────────────────────────── */}
      <RemainingRiskBanner redactions={redactions} onJump={handleJump} />

      {/* ── Keyboard Shortcuts Overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FFFDF9] border border-[#E8DED1] rounded-2xl p-8 shadow-2xl w-80"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-serif text-lg font-semibold text-[#1F1F1F] mb-5">Keyboard Shortcuts</h3>
              <div className="space-y-2.5">
                {[
                  ["A", "Accept / Confirm"],
                  ["R", "Reject"],
                  ["I", "Ignore & Skip"],
                  ["E / Space", "Show Detail"],
                  ["N / J", "Next Entity"],
                  ["P / K", "Previous Entity"],
                  ["S", "Toggle Alerts"],
                  ["⌘Z", "Undo Last Action"],
                  ["?", "Toggle Shortcuts"],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-[#555]">{desc}</span>
                    <kbd className="font-mono text-xs bg-[#F5F1EA] border border-[#E8DED1] text-[#1F1F1F] px-2 py-0.5 rounded-md">{key}</kbd>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-6 bg-[#6B1E2B] text-white hover:bg-[#7D2334]" onClick={() => setShowShortcuts(false)}>
                Got it
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Document Panel */}
<main className="flex-1 overflow-y-auto" onMouseUp={handleMouseUp}>
          <div
            className={`max-w-3xl mx-auto py-12 px-12 bg-[#FFFDF9] min-h-[800px] shadow-sm relative transition-all duration-300 ${activeTab === "rejected" ? "opacity-95" : ""
              }`}
            ref={contentRef}
            onMouseUp={handleMouseUp}
          >
            {document.filePath && document.title.toLowerCase().endsWith('.pdf') ? (
              <PDFViewer
                documentId={id}
                redactions={redactions}
                selectedId={selectedId}
                onRedactionClick={setSelectedId}
                docViewMode={docViewMode}
              />
            ) : (
              <>
                {/* Document View Mode Label */}
                {docViewMode !== "original" && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-2 bg-[#FFFDF9] border border-[#E8DED1] rounded-xl px-4 py-2 text-xs text-[#666]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {docViewMode === "reviewed"
                      ? "Reviewed view — showing document with confirmed redactions applied"
                      : "Export preview — showing final redacted document"}
                  </motion.div>
                )}

                {/* Manual selection hint */}
                {docViewMode === "original" && (
                  <div className="rounded-xl border border-[#E8DED1] bg-[#FFFDF9] px-4 py-2.5 text-xs text-[#888] flex items-center gap-2 mb-8 shadow-sm">
                    <MousePointerSquareDashed className="h-3.5 w-3.5" />
                    <span>Select any text to manually mark it as PII</span>
                    <span className="ml-auto text-[#bbb]">Press <kbd className="font-mono bg-[#F5F1EA] px-1 rounded">?</kbd> for keyboard shortcuts</span>
                  </div>
                )}

                {/* Document Content */}
                {document.htmlContent && docViewMode !== "export" ? (
                  // ── Rich HTML viewer (preserves original document formatting) ──
                  <div
                    className="doc-html-viewer font-serif text-[16px] leading-[1.8] text-[#1F1F1F]/90"
                    style={{
                      fontFamily: "'Georgia', serif",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: (() => {
                        let html = document.htmlContent!;

                        // Inject PII highlight spans by replacing matching text in the HTML.
                        // Sort by longest text first to avoid nested/partial replacements.
                        const sorted = [...redactions].sort((a, b) => b.text.length - a.text.length);

                        for (const r of sorted) {
                          if (!r.text || r.text.length < 2) continue;
                          const escapedText = r.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

                          const isConfirmed = r.status === "confirmed" || r.status === "user_added";
                          const consensus = parseConsensus(r.note);
                          const isSecond = isSecondOpinion(consensus);
                          const sev = getSeverity(r.category);

                          let style = "";
                          let extra = "";
                          if (docViewMode === "reviewed" && isConfirmed) {
                            style = "background:#000;color:transparent;border-radius:3px;padding:0 2px;";
                          } else if (docViewMode === "original") {
                            if (r.status === "rejected") {
                              style = "opacity:0.5;";
                            } else if (isSecond && r.status === "pending") {
                              style = "background:#fed7aa;border-bottom:2px solid #f97316;color:#7c2d12;padding:0 2px;border-radius:2px;cursor:pointer;";
                            } else if (sev === "critical") {
                              style = "background:#fee2e2;border-bottom:2px solid #dc2626;color:#7f1d1d;padding:0 2px;border-radius:2px;cursor:pointer;";
                            } else if (sev === "high") {
                              style = "background:#fff7ed;border-bottom:2px solid #fb923c;color:#7c2d12;padding:0 2px;border-radius:2px;cursor:pointer;";
                            } else {
                              style = "background:#fef3c7;border-bottom:2px solid #f59e0b;color:#78350f;padding:0 2px;border-radius:2px;cursor:pointer;";
                            }
                            if (r.status === "user_added") {
                              style = "background:#e0e7ff;border-bottom:2px solid #6366f1;color:#312e81;padding:0 2px;border-radius:2px;cursor:pointer;";
                            }
                            if (isConfirmed) style += "text-decoration:line-through;opacity:0.7;";
                            if (selectedId === r.id) style += "outline:2px solid #6B1E2B;outline-offset:1px;";
                            if (r.status === "confirmed") extra = `<sup style="font-size:8px;background:#4C7A53;color:#fff;border-radius:2px;padding:0 3px;margin-left:2px;">R</sup>`;
                            if (r.status === "rejected") extra = `<sup style="font-size:8px;background:#6b7280;color:#fff;border-radius:2px;padding:0 3px;margin-left:2px;">I</sup>`;
                            if (r.status === "user_added") extra = `<sup style="font-size:8px;background:#6B1E2B;color:#fff;border-radius:2px;padding:0 3px;margin-left:2px;">R</sup>`;
                          }

                          // Only replace first occurrence per redaction (text may appear many times but offsets are specific)
                          html = html.replace(
                            new RegExp(`(?![^<]*>)(${escapedText})`, "m"),
                            `<mark id="doc-redaction-${r.id}" data-rid="${r.id}" style="${style}background-color:unset;">${"$1"}${extra}</mark>`
                          );
                        }

                        // Apply styles for HTML elements from mammoth
                        return `<style>
                          .doc-html-viewer p { margin-bottom: 0.75em; }
                          .doc-html-viewer h1, .doc-html-viewer h2, .doc-html-viewer h3 { font-weight: bold; margin: 1.2em 0 0.4em; }
                          .doc-html-viewer h1 { font-size: 1.4em; }
                          .doc-html-viewer h2 { font-size: 1.2em; }
                          .doc-html-viewer strong, .doc-html-viewer b { font-weight: 700; }
                          .doc-html-viewer em, .doc-html-viewer i { font-style: italic; }
                          .doc-html-viewer table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                          .doc-html-viewer td, .doc-html-viewer th { border: 1px solid #E8DED1; padding: 6px 10px; }
                          .doc-html-viewer ul, .doc-html-viewer ol { padding-left: 1.5em; margin: 0.5em 0; }
                          .doc-html-viewer li { margin-bottom: 0.25em; }
                          .doc-html-viewer mark { background: unset; }
                        </style>${html}`;
                      })()
                    }}
                    onClick={(e) => {
                      const target = (e.target as HTMLElement).closest("mark[data-rid]");
                      if (target) setSelectedId((target as HTMLElement).dataset.rid!);
                    }}
                  />
                ) : (
                  // ── Plain text viewer (fallback for txt/plain docs) ──
                  <div className="font-serif text-[17px] leading-[1.9] text-[#1F1F1F]/90 whitespace-pre-wrap">
                  {chunks.map(chunk => {
                    if (chunk.isNormal) return <span key={chunk.id}>{chunk.text}</span>;

                    const r = chunk.redaction;
                    if (!r) return null;

                    if (docViewMode === "original") {
                      const isSelected = selectedId === r.id;
                      const consensus = parseConsensus(r.note);
                      const isSecond = isSecondOpinion(consensus);
                      const sev = getSeverity(r.category);
                      const similarCount = getSimilarCount(r);

                      let cls = "";
                      if (isSecond && r.status === "pending") {
                        cls = "bg-orange-100 border-b-2 border-orange-500 text-orange-900 px-0.5 rounded-sm cursor-pointer transition-all hover:bg-orange-200";
                      } else if (sev === "critical") {
                        cls = "bg-red-100 border-b-2 border-red-600 text-red-900 px-0.5 rounded-sm cursor-pointer transition-all hover:bg-red-200";
                      } else if (sev === "high") {
                        cls = "bg-orange-50 border-b-2 border-orange-400 text-orange-900 px-0.5 rounded-sm cursor-pointer transition-all hover:bg-orange-100";
                      } else {
                        cls = "bg-amber-50 border-b-2 border-amber-400 text-amber-900 px-0.5 rounded-sm cursor-pointer transition-all hover:bg-amber-100";
                      }

                      if (r.status === "user_added") {
                        cls = "bg-indigo-100 border-b-2 border-indigo-500 text-indigo-900 px-0.5 rounded-sm cursor-pointer transition-all hover:bg-indigo-200";
                      }

                      if (r.status === "confirmed" || r.status === "user_added") {
                        cls += " line-through opacity-70";
                      } else if (r.status === "rejected") {
                        cls += " opacity-50";
                      }

                      if (isSelected) cls += " ring-2 ring-[#6B1E2B] ring-offset-1 z-10 relative";

                      return (
                        <Tooltip key={chunk.id} delayDuration={200}>
                          <TooltipTrigger asChild>
                            <span
                              id={`doc-redaction-${r.id}`}
                              className={cls}
                              onClick={() => setSelectedId(r.id)}
                            >
                              {chunk.text}
                              {r.status === "confirmed" && (
                                <sup className="text-[9px] ml-0.5 text-white font-bold bg-[#4C7A53] rounded px-1 py-0.5">R</sup>
                              )}
                              {r.status === "rejected" && (
                                <sup className="text-[9px] ml-0.5 text-white font-bold bg-gray-500 rounded px-1 py-0.5">I</sup>
                              )}
                              {r.status === "user_added" && (
                                <sup className="text-[9px] ml-0.5 text-white font-bold bg-[#6B1E2B] rounded px-1 py-0.5">R</sup>
                              )}
                              {similarCount > 0 && r.status === "pending" && (
                                <sup className="text-[8px] ml-0.5 text-[#6B1E2B] font-bold bg-white/80 rounded px-0.5 shadow-sm">+{similarCount}</sup>
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs font-sans bg-[#1F1F1F] text-white border-none max-w-48">
                            <div className="font-semibold capitalize">{r.category}</div>
                            <div className="text-white/70 mt-0.5 capitalize">{getSeverity(r.category)} severity</div>
                            {consensus && <div className="text-white/70">{consensus.count}/3 models agree</div>}
                            {isSecond && <div className="text-orange-300 font-medium mt-0.5">Second Opinion — 1 model only</div>}
                            {similarCount > 0 && <div className="text-white/60 mt-0.5">Appears {similarCount} more time{similarCount > 1 ? "s" : ""}</div>}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    // For Reviewed and Export mode
                    const isConfirmed = r.status === "confirmed" || r.status === "user_added";

                    if (!isConfirmed) {
                      return <span key={chunk.id}>{chunk.text}</span>;
                    }

                    if (docViewMode === "reviewed") {
                      return (
                        <span key={chunk.id} className="bg-black text-transparent select-none rounded-sm px-1 mx-0.5" aria-hidden="true" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000, #000 5px, #222 5px, #222 10px)" }}>
                          {chunk.text}
                        </span>
                      );
                    }

                    if (docViewMode === "export") {
                      return <span key={chunk.id}>{"█".repeat(chunk.text.length)}</span>;
                    }

                    return null;
                  })}
                  </div>
                )}

                  {docViewMode === "export" && (
                    <div className="mt-12 p-8 bg-[#FFFDF9] rounded-2xl border border-[#E8DED1] shadow-sm flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-[#F5F1EA] rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="h-8 w-8 text-[#6B1E2B]" />
                      </div>
                      <h3 className="font-serif text-xl font-bold text-[#1F1F1F] mb-3">Ready for Final Export</h3>
                      <p className="text-[#666] text-[15px] mb-8 max-w-[500px]">
                        The document has been fully reviewed. Click below to generate the final redacted PDF with all PII permanently and irreversibly removed.
                      </p>
                      <Button onClick={() => {
                          window.open(`/api/documents/${id}/export-redacted`, "_blank");
                          toast.success("Document exported successfully"); 
                          setLocation("/dashboard"); 
                       }} className="bg-[#6B1E2B] text-white hover:bg-[#7D2334] h-12 px-8 text-base shadow-lg transition-transform hover:scale-105">
                         <Download className="h-5 w-5 mr-2" />
                         Generate Secure PDF
                       </Button>
                    </div>
                  )}
              </>
            )}
          </div>

          {/* Manual Selection Popover */}
          <AnimatePresence>
            {selection && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed z-50"
                style={{ left: selection.x, top: selection.y, transform: "translate(-50%, -100%)" }}
              >
                <div className="bg-[#FFFDF9] border border-[#E8DED1] shadow-2xl rounded-2xl p-4 flex flex-col gap-3 w-64">
                  <div className="text-sm font-serif font-semibold text-[#1F1F1F]">Mark as PII</div>
                  <div className="text-xs font-mono bg-[#F5F1EA] rounded-lg px-2 py-1 text-[#1F1F1F] truncate">{selection.text}</div>
                  <div className="flex gap-2">
                    <Select value={newCategory} onValueChange={(v: any) => setNewCategory(v)}>
                      <SelectTrigger className="h-8 flex-1 text-xs border-[#E8DED1]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(RedactionInputCategory).map(cat => (
                          <SelectItem key={cat} value={cat} className="capitalize text-xs">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleAddRedaction} disabled={createRedaction.isPending} className="h-8 px-3 bg-[#6B1E2B] text-white hover:bg-[#7D2334]">
                      Add
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelection(null)} className="h-8 px-2">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
        <div className="relative w-1/4 min-w-[560px] max-w-[400px] shrink-0 flex flex-col h-full overflow-hidden">
          <ReviewSidebar
            redactions={redactions}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onConfirm={id => handleStatusChange(id, "confirmed")}
            onReject={id => handleStatusChange(id, "rejected")}
            onIgnore={id => handleStatusChange(id, "ignored")}
            onDelete={handleDelete}
            onShowDetail={setDetailPanelId}
            onJump={handleJump}
            onCategoryChange={handleCategoryChange}
            actions={actions}
            pendingList={pendingRedactions}
            confirmedList={confirmedRedactions}
            rejectedList={rejectedRedactions}
            userList={userRedactions}
          />

          {/* Detail Panel overlay */}
          <AnimatePresence>
            {detailPanelId && detailRedaction && (
              <EntityDetailPanel
                redaction={detailRedaction}
                documentContent={document.content}
                allRedactions={redactions}
                onClose={() => setDetailPanelId(null)}
                onCategoryChange={handleCategoryChange}
                onConfirm={(rid) => handleStatusChange(rid, "confirmed")}
                onReject={(rid) => handleStatusChange(rid, "rejected")}
                onIgnore={(rid) => handleStatusChange(rid, "ignored")}
                onConfirmAll={(ids) => ids.forEach(rid => handleStatusChange(rid, "confirmed"))}
                onRejectAll={(ids) => ids.forEach(rid => handleStatusChange(rid, "rejected"))}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom Status Bar ─────────────────────────────────────────────── */}
      <div className="shrink-0 h-9 bg-[#1F1F1F] text-white/60 flex items-center px-4 gap-6 text-[10px] font-mono z-20">
        <div className="flex items-center gap-4">
          <span className="text-white/40">Navigate</span>
          <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/80">J</kbd>
          <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/80">K</kbd>
          <span className="text-white/40 ml-2">Redact</span>
          <kbd className="bg-[#6B1E2B]/80 px-1.5 py-0.5 rounded text-white">R</kbd>
          <span className="text-white/40 ml-2">Ignore</span>
          <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/80">I</kbd>
          <span className="text-white/40 ml-2">Undo</span>
          <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/80">⌘Z</kbd>
        </div>
        <div className="ml-auto flex items-center gap-5">
          <span>
            CONFLICTS: <span className="text-amber-400 font-bold">{redactions.filter(r => { try { const c = JSON.parse(r.note ?? '{}'); return c.count > 0 && c.count < 3 && r.status === 'pending'; } catch { return false; } }).length.toString().padStart(2,'0')}</span>
          </span>
          <span>
            MATCHES: <span className="text-emerald-400 font-bold">{redactions.filter(r => r.status === 'pending').length.toString().padStart(2,'0')}</span>
          </span>
          <span>
            UNRESOLVED: <span className="text-red-400 font-bold">{redactions.filter(r => { try { const c = JSON.parse(r.note ?? '{}'); return c.count === 1 && r.status === 'pending'; } catch { return false; } }).length.toString().padStart(2,'0')}</span>
          </span>
        </div>
      </div>

      {/* AI Auditor Floating Widget */}
      <AIAuditorWidget documentId={id} />

      {/* Complete Review Confirmation Modal */}
      <CompleteReviewModal
        open={completeModalOpen}
        pendingCount={pendingRedactions.length}
        confirmedCount={confirmedRedactions.length}
        isCompleting={completeMutation.isPending}
        onClose={() => setCompleteModalOpen(false)}
        onProceedToFinalScan={handleConfirmedComplete}
        onSkipAndExport={() => {
          setCompleteModalOpen(false);
          window.open(`/api/documents/${id}/export-redacted`, "_blank");
        }}
      />
    </div>
  );
}