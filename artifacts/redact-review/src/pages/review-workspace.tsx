import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetDocument, 
  useCompleteReview, 
  getGetDocumentQueryKey,
  useUpdateRedaction,
  useGetSuspiciousText,
  useCreateRedaction,
  useDeleteRedaction,
  RedactionInputCategory,
  Redaction
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, AlertTriangle, Eye, ShieldAlert, ArrowLeft, MousePointerSquareDashed, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ReviewWorkspace() {
  const params = useParams();
  const id = params.id as string;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: document, isLoading } = useGetDocument(id, { query: { enabled: !!id, queryKey: getGetDocumentQueryKey(id) } });
  const { data: suspiciousText } = useGetSuspiciousText(id, { query: { enabled: !!id } });
  const completeMutation = useCompleteReview();
  const updateRedaction = useUpdateRedaction();
  const createRedaction = useCreateRedaction();
  const deleteRedaction = useDeleteRedaction();

  const [activeTab, setActiveTab] = useState<"pending"|"confirmed"|"rejected"|"user">("pending");
  const [selectedRedactionId, setSelectedRedactionId] = useState<string|null>(null);
  const [suspiciousDrawerOpen, setSuspiciousDrawerOpen] = useState(false);

  // Keyboard navigation state
  const pendingRedactions = useMemo(() => document?.redactions?.filter(r => r.status === "pending") || [], [document]);
  
  const handleStatusChange = (redactionId: string, status: "confirmed" | "rejected" | "pending") => {
    updateRedaction.mutate(
      { id, redactionId, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
        }
      }
    );
  };

  const handleDeleteRedaction = (redactionId: string) => {
    deleteRedaction.mutate(
      { id, redactionId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
        }
      }
    );
  };

  const handleComplete = () => {
    completeMutation.mutate(
      { id },
      {
        onSuccess: () => {
          setLocation(`/review/${id}/complete`);
        }
      }
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 's' || e.key === 'S') {
        setSuspiciousDrawerOpen(prev => !prev);
      }

      if (pendingRedactions.length === 0) return;

      const currentIndex = pendingRedactions.findIndex(r => r.id === selectedRedactionId);

      if (e.key === 'j' || e.key === 'J') {
        const nextIndex = currentIndex < pendingRedactions.length - 1 ? currentIndex + 1 : 0;
        setSelectedRedactionId(pendingRedactions[nextIndex].id);
        window.document.getElementById(`redaction-${pendingRedactions[nextIndex].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (e.key === 'k' || e.key === 'K') {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : pendingRedactions.length - 1;
        setSelectedRedactionId(pendingRedactions[prevIndex].id);
        window.document.getElementById(`redaction-${pendingRedactions[prevIndex].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (selectedRedactionId) {
        if (e.key === 'c' || e.key === 'C') {
          handleStatusChange(selectedRedactionId, "confirmed");
        }
        if (e.key === 'r' || e.key === 'R') {
          handleStatusChange(selectedRedactionId, "rejected");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingRedactions, selectedRedactionId, id, queryClient, updateRedaction]);

  // Selection for new redaction
  const [selection, setSelection] = useState<{start: number, end: number, text: string, x: number, y: number} | null>(null);
  const [newCategory, setNewCategory] = useState<RedactionInputCategory>("other");
  const contentRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !contentRef.current) {
      if (!selection) return;
      return; 
    }

    const range = sel.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(contentRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const text = sel.toString();
    const end = start + text.length;

    const rect = range.getBoundingClientRect();
    
    setSelection({
      start,
      end,
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
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
          category: newCategory
        }
      },
      {
        onSuccess: () => {
          setSelection(null);
          window.getSelection()?.removeAllRanges();
          queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
        }
      }
    );
  };

  if (isLoading || !document) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-[#1E1E1E]">
        <ShieldAlert className="h-12 w-12 text-[#6B1E2B] animate-pulse" />
        <p className="font-serif text-xl">Loading secure workspace...</p>
        <p className="text-muted-foreground text-sm font-sans">Preparing document and analytics.</p>
      </div>
    </div>
  );

  const redactions = document.redactions || [];
  const confirmed = redactions.filter(r => r.status === "confirmed");
  const rejected = redactions.filter(r => r.status === "rejected");
  const userAdded = redactions.filter(r => r.status === "user_added");

  const activeList = 
    activeTab === "pending" ? pendingRedactions : 
    activeTab === "confirmed" ? confirmed : 
    activeTab === "rejected" ? rejected : userAdded;

  const totalReviewed = confirmed.length + rejected.length + userAdded.length;
  const totalItems = redactions.length;
  const progress = totalItems > 0 ? (totalReviewed / totalItems) * 100 : 100;

  // Build text chunks
  let chunks: { text: string; redaction?: Redaction; suspicious?: any; isNormal?: boolean; id: string }[] = [];
  
  if (document.content) {
    const markers: any[] = [];
    redactions.forEach(r => markers.push({ ...r, type: 'redaction' }));
    if (suspiciousText) {
      suspiciousText.forEach((s: any) => {
        const overlaps = redactions.some(r => 
          (s.startOffset >= r.startOffset && s.startOffset < r.endOffset) ||
          (s.endOffset > r.startOffset && s.endOffset <= r.endOffset) ||
          (s.startOffset <= r.startOffset && s.endOffset >= r.endOffset)
        );
        if (!overlaps) {
          markers.push({ ...s, type: 'suspicious', id: `suspicious-${s.startOffset}` });
        }
      });
    }

    markers.sort((a, b) => a.startOffset - b.startOffset);

    let lastIdx = 0;
    markers.forEach((m) => {
      if (m.startOffset > lastIdx) {
        chunks.push({ text: document.content.substring(lastIdx, m.startOffset), isNormal: true, id: `norm-${lastIdx}` });
      }
      if (m.type === 'redaction') {
        chunks.push({ text: m.text, redaction: m, id: `red-${m.id}` });
      } else {
        chunks.push({ text: m.text, suspicious: m, id: `susp-${m.id}` });
      }
      lastIdx = Math.max(lastIdx, m.endOffset);
    });
    if (lastIdx < document.content.length) {
      chunks.push({ text: document.content.substring(lastIdx), isNormal: true, id: `norm-${lastIdx}` });
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden text-foreground">
      {/* Topbar */}
      <header className="h-14 shrink-0 bg-[#FFFDF9] border-b border-[#E5DDD2] shadow-sm px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="text-[#666666]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-6 w-px bg-[#E5DDD2]"></div>
          <h1 className="font-serif font-semibold text-[#1E1E1E] text-lg truncate max-w-xs">{document.title}</h1>
        </div>
        
        <div className="flex items-center gap-4 w-48">
          <div className="flex flex-col w-full">
            <div className="flex justify-between text-[11px] text-[#888888] font-medium mb-1">
              <span>{totalReviewed} / {totalItems} reviewed</span>
            </div>
            <div className="h-1 w-full bg-[#E5DDD2] rounded-full overflow-hidden">
               <div className="h-full bg-[#6B1E2B] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {suspiciousText && suspiciousText.length > 0 && (
            <Drawer open={suspiciousDrawerOpen} onOpenChange={setSuspiciousDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-orange-500 text-white border-none hover:bg-orange-600 animate-in slide-in-from-top-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  {suspiciousText.length} Alerts
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-[#FFFDF9]">
                <div className="mx-auto w-full max-w-2xl">
                  <DrawerHeader>
                    <DrawerTitle className="flex items-center gap-2 text-[#1E1E1E] font-serif text-xl">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Suspicious Spans
                    </DrawerTitle>
                    <DrawerDescription className="text-[#666666]">
                      Review spans missed by AI detection.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                    {suspiciousText.map((st: any, i: number) => (
                      <div key={i} className="flex flex-col gap-2 p-4 border border-orange-200 bg-orange-50 rounded-xl">
                        <div className="font-mono text-sm bg-white p-2 rounded-md border border-orange-100 text-[#1E1E1E]">{st.text}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{st.reason}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.riskLevel === 'high' ? 'bg-[#A92B2B] text-white' : st.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>{st.riskLevel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          )}

          <div className="hidden lg:flex items-center gap-2">
            <kbd className="font-mono text-xs bg-[#F5F1EA] text-[#666666] px-1.5 py-0.5 rounded">J/K</kbd>
            <kbd className="font-mono text-xs bg-[#F5F1EA] text-[#666666] px-1.5 py-0.5 rounded">C/R</kbd>
          </div>

          <Button 
            disabled={pendingRedactions.length > 0 || completeMutation.isPending} 
            onClick={handleComplete}
            className="font-medium bg-[#6B1E2B] text-white hover:bg-[#7D2334] disabled:opacity-40"
          >
            Complete Review
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Document Panel */}
        <main 
          className="flex-1 overflow-y-auto bg-background"
          onMouseUp={handleMouseUp}
        >
          <div className="max-w-[720px] mx-auto py-12 px-8">
            <div className="rounded-lg border border-[#E5DDD2] bg-[#FFFDF9] px-4 py-2 text-sm text-[#666666] flex items-center gap-2 mb-8">
              <MousePointerSquareDashed className="h-4 w-4" />
              <span>Select any text to manually add a redaction.</span>
            </div>
            
            <div 
              ref={contentRef}
              className="font-serif text-[17px] leading-[1.85] text-[#1E1E1E]/90 whitespace-pre-wrap"
            >
              {chunks.map((chunk) => {
                if (chunk.isNormal) return <span key={chunk.id}>{chunk.text}</span>;
                
                if (chunk.redaction) {
                  const r = chunk.redaction;
                  const isSelected = selectedRedactionId === r.id;
                  
                  let highlightClass = "";
                  if (r.status === "pending") highlightClass = "bg-amber-50 border-b-2 border-amber-400 text-amber-900 px-0.5 rounded-sm cursor-pointer transition-all duration-150 hover:bg-amber-100";
                  else if (r.status === "confirmed") highlightClass = "bg-[#A92B2B] text-white px-0.5 rounded-sm cursor-pointer";
                  else if (r.status === "rejected") highlightClass = "opacity-40 line-through decoration-gray-400 cursor-pointer";
                  else if (r.status === "user_added") highlightClass = "bg-indigo-50 border-b-2 border-indigo-400 text-indigo-900 px-0.5 rounded-sm cursor-pointer transition-all duration-150";
                  
                  if (isSelected) highlightClass += " ring-2 ring-[#6B1E2B] ring-offset-1 z-10 relative";

                  return (
                    <Tooltip key={chunk.id}>
                      <TooltipTrigger asChild>
                        <span 
                          id={`redaction-${r.id}`}
                          className={highlightClass}
                          onClick={() => setSelectedRedactionId(r.id)}
                        >
                          {chunk.text}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs font-sans">
                        <div className="font-semibold capitalize">{r.category}</div>
                        {r.source === 'ai' && (
                          <div className="text-muted-foreground mt-0.5">{(r.confidence * 100).toFixed(0)}% AI confidence</div>
                        )}
                        {r.source === 'user' && (
                          <div className="text-muted-foreground mt-0.5">Added by user</div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                if (chunk.suspicious) {
                  return (
                    <Tooltip key={chunk.id}>
                      <TooltipTrigger asChild>
                        <span 
                          className="bg-orange-50 border-b-2 border-orange-400 font-medium animate-pulse cursor-help px-0.5 rounded-sm"
                        >
                          {chunk.text}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs font-sans bg-orange-500 text-white border-none">
                        <div className="font-semibold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Missed Risk
                        </div>
                        <div className="mt-0.5 opacity-90">{chunk.suspicious.reason}</div>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                
                return null;
              })}
            </div>
          </div>
          
          {/* Custom Selection Popover */}
          {selection && (
            <div 
              className="fixed z-50 animate-in fade-in zoom-in-95 duration-200"
              style={{ left: selection.x, top: selection.y, transform: 'translate(-50%, -100%)' }}
            >
              <div className="bg-[#FFFDF9] border border-[#E5DDD2] shadow-xl rounded-xl p-4 flex flex-col gap-3 w-64">
                <div className="text-sm font-medium font-serif">Mark as PII</div>
                <div className="text-xs font-mono bg-[#F5F1EA] rounded-md px-2 py-1 text-[#1E1E1E] truncate">{selection.text}</div>
                <div className="flex gap-2">
                  <Select value={newCategory} onValueChange={(v: any) => setNewCategory(v)}>
                    <SelectTrigger className="h-8 flex-1 text-xs">
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
                  <Button size="sm" variant="ghost" onClick={() => setSelection(null)} className="h-8 px-2 text-[#666666]">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-[380px] border-l border-[#E5DDD2] bg-[#FAF7F2] flex flex-col shadow-[-4px_0_20px_rgba(0,0,0,0.04)] z-10">
          <div className="flex gap-1 p-2 border-b border-[#E5DDD2]">
            <button 
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'pending' ? 'bg-[#FFFDF9] border border-[#E5DDD2] shadow-sm text-[#1E1E1E]' : 'text-[#888888] hover:bg-white/50'}`}
              onClick={() => setActiveTab('pending')}
            >
              Review ({pendingRedactions.length})
            </button>
            <button 
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'confirmed' ? 'bg-[#FFFDF9] border border-[#E5DDD2] shadow-sm text-[#1E1E1E]' : 'text-[#888888] hover:bg-white/50'}`}
              onClick={() => setActiveTab('confirmed')}
            >
              Conf ({confirmed.length})
            </button>
            <button 
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'rejected' ? 'bg-[#FFFDF9] border border-[#E5DDD2] shadow-sm text-[#1E1E1E]' : 'text-[#888888] hover:bg-white/50'}`}
              onClick={() => setActiveTab('rejected')}
            >
              Rej ({rejected.length})
            </button>
            <button 
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === 'user' ? 'bg-[#FFFDF9] border border-[#E5DDD2] shadow-sm text-[#1E1E1E]' : 'text-[#888888] hover:bg-white/50'}`}
              onClick={() => setActiveTab('user')}
            >
              Added ({userAdded.length})
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {activeList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-[#888888]">
                  <Check className="h-10 w-10 opacity-50 mb-3" />
                  <p className="text-sm font-medium">All clear</p>
                </div>
              ) : (
                activeList.map(r => (
                  <motion.div 
                    key={r.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -1 }}
                    className={`
                      bg-[#FFFDF9] border border-[#E5DDD2] rounded-xl p-4 cursor-pointer
                      ${selectedRedactionId === r.id ? 'border-[#6B1E2B] ring-1 ring-[#6B1E2B]/30' : ''}
                    `}
                    onClick={() => {
                      setSelectedRedactionId(r.id);
                      window.document.getElementById(`redaction-${r.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-mono text-xs bg-[#F5F1EA] px-2 py-1 rounded-md text-[#1E1E1E] line-clamp-2">
                        {r.text}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider border rounded-full px-2 py-0.5 text-[#666666]">
                        {r.category}
                      </span>
                    </div>

                    {r.source === 'ai' && (
                      <div className="h-1.5 rounded-full bg-[#E5DDD2] w-full overflow-hidden mt-2 mb-3">
                        <div className={`h-full ${r.status === 'pending' ? 'bg-amber-400' : r.status === 'confirmed' ? 'bg-[#4C7A53]' : 'bg-gray-400'}`} style={{ width: `${r.confidence * 100}%` }} />
                      </div>
                    )}
                    
                    {activeTab === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-[#4C7A53] hover:bg-[#3d6343] text-white text-xs h-8" 
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(r.id, "confirmed"); }}
                        >
                          <Check className="h-3 w-3 mr-1" /> Confirm
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border border-[#E5DDD2] text-[#666666] hover:border-[#A92B2B] hover:text-[#A92B2B] text-xs h-8" 
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(r.id, "rejected"); }}
                        >
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                    
                    {activeTab !== "pending" && (
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#E5DDD2] text-xs text-[#888888]">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Reviewed
                        </span>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 hover:text-[#A92B2B]"
                            onClick={(e) => { e.stopPropagation(); handleDeleteRedaction(r.id); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </div>
  );
}