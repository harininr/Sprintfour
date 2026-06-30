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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, AlertTriangle, Eye, ShieldAlert, ArrowRight, MousePointerSquareDashed, Trash2 } from "lucide-react";

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
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 's' || e.key === 'S') {
        setSuspiciousDrawerOpen(prev => !prev);
      }

      if (pendingRedactions.length === 0) return;

      const currentIndex = pendingRedactions.findIndex(r => r.id === selectedRedactionId);

      if (e.key === 'j' || e.key === 'J') {
        const nextIndex = currentIndex < pendingRedactions.length - 1 ? currentIndex + 1 : 0;
        setSelectedRedactionId(pendingRedactions[nextIndex].id);
        document?.getElementById(`redaction-${pendingRedactions[nextIndex].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (e.key === 'k' || e.key === 'K') {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : pendingRedactions.length - 1;
        setSelectedRedactionId(pendingRedactions[prevIndex].id);
        document?.getElementById(`redaction-${pendingRedactions[prevIndex].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      // Don't clear selection immediately to allow clicking the popover
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
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <ShieldAlert className="h-12 w-12 animate-pulse" />
        <p>Loading secure workspace...</p>
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
        // Only add suspicious span if it doesn't overlap with a redaction
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
    <div className="h-screen flex flex-col bg-background overflow-hidden text-foreground">
      {/* Topbar */}
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-lg tracking-tight">{document.title}</h1>
          </div>
          <div className="h-6 w-px bg-border"></div>
          <div className="flex flex-col gap-1 w-48">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>Review Progress</span>
              <span>{totalReviewed} / {totalItems}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {suspiciousText && suspiciousText.length > 0 && (
            <Drawer open={suspiciousDrawerOpen} onOpenChange={setSuspiciousDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2 bg-status-suspicious hover:bg-status-suspicious/90 shadow-md animate-in slide-in-from-top-2">
                  <AlertTriangle className="h-4 w-4" />
                  {suspiciousText.length} Missed Risks
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-2xl">
                  <DrawerHeader>
                    <DrawerTitle className="flex items-center gap-2 text-status-suspicious">
                      <AlertTriangle className="h-5 w-5" />
                      Suspicious Text Spans
                    </DrawerTitle>
                    <DrawerDescription>
                      The AI might have missed these. Review them carefully.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                    {suspiciousText.map((st: any, i: number) => (
                      <div key={i} className="flex flex-col gap-2 p-4 border border-status-suspicious/30 bg-status-suspicious/5 rounded-lg">
                        <div className="font-mono text-sm bg-background p-2 rounded border">{st.text}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{st.reason}</span>
                          <Badge variant={st.riskLevel === 'high' ? 'destructive' : 'secondary'}>{st.riskLevel}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="hidden lg:flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md border">
              <kbd className="font-mono font-medium">J</kbd>/<kbd className="font-mono font-medium">K</kbd> next
            </span>
            <span className="hidden lg:flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md border">
              <kbd className="font-mono font-medium">C</kbd> confirm
            </span>
            <span className="hidden lg:flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md border">
              <kbd className="font-mono font-medium">R</kbd> reject
            </span>
            <span className="hidden lg:flex items-center gap-1.5 bg-status-suspicious/10 text-status-suspicious px-2 py-1 rounded-md border border-status-suspicious/20">
              <kbd className="font-mono font-medium">S</kbd> risks
            </span>
            <div className="h-6 w-px bg-border mx-2"></div>
            <Button 
              disabled={pendingRedactions.length > 0 || completeMutation.isPending} 
              onClick={handleComplete}
              className="font-medium"
            >
              Complete Review <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Document Panel */}
        <main 
          className="flex-1 overflow-y-auto p-8 lg:p-16 relative bg-background"
          onMouseUp={handleMouseUp}
        >
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 flex items-center text-muted-foreground text-sm gap-2">
              <MousePointerSquareDashed className="h-4 w-4" />
              <span>Select any text to manually add a redaction.</span>
            </div>
            
            <div 
              ref={contentRef}
              className="font-serif text-lg leading-[1.8] text-foreground/90 whitespace-pre-wrap selection:bg-primary/20 selection:text-primary"
            >
              {chunks.map((chunk) => {
                if (chunk.isNormal) return <span key={chunk.id}>{chunk.text}</span>;
                
                if (chunk.redaction) {
                  const r = chunk.redaction;
                  const isSelected = selectedRedactionId === r.id;
                  
                  let bgClass = "bg-status-pending/20 text-status-pending-foreground border-b-2 border-status-pending";
                  if (r.status === "confirmed") bgClass = "bg-status-confirmed text-status-confirmed-foreground";
                  if (r.status === "rejected") bgClass = "opacity-50 line-through decoration-status-rejected";
                  if (r.status === "user_added") bgClass = "bg-status-user/20 text-status-user-foreground border-b-2 border-status-user";
                  
                  return (
                    <Tooltip key={chunk.id}>
                      <TooltipTrigger asChild>
                        <span 
                          id={`redaction-${r.id}`}
                          className={`
                            px-1 rounded-sm cursor-pointer transition-all duration-200
                            ${bgClass}
                            ${isSelected ? 'ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-sm z-10 relative' : ''}
                          `}
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
                          className="bg-status-suspicious/30 text-status-suspicious-foreground border-b-2 border-status-suspicious font-medium px-1 rounded-sm cursor-help relative animate-pulse"
                        >
                          {chunk.text}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs font-sans bg-status-suspicious text-white border-none">
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
              <div className="bg-popover border text-popover-foreground shadow-lg rounded-lg p-3 flex flex-col gap-3 w-64">
                <div className="text-sm font-medium">Mark as PII?</div>
                <div className="text-xs font-mono bg-muted p-1.5 rounded truncate">{selection.text}</div>
                <div className="flex gap-2">
                  <Select value={newCategory} onValueChange={(v: any) => setNewCategory(v)}>
                    <SelectTrigger className="h-8 flex-1">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(RedactionInputCategory).map(cat => (
                        <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddRedaction} disabled={createRedaction.isPending} className="h-8 px-3">
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelection(null)} className="h-8 px-2">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-[400px] border-l bg-sidebar flex flex-col shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
          <div className="flex p-3 gap-1.5 border-b bg-muted/30">
            <button 
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${activeTab === 'pending' ? 'bg-background text-foreground shadow-sm border' : 'text-muted-foreground hover:bg-muted'}`}
              onClick={() => setActiveTab('pending')}
            >
              Review <span className="ml-1 bg-status-pending/20 text-status-pending px-1.5 py-0.5 rounded-full">{pendingRedactions.length}</span>
            </button>
            <button 
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${activeTab === 'confirmed' ? 'bg-status-confirmed/10 text-status-confirmed shadow-sm border border-status-confirmed/20' : 'text-muted-foreground hover:bg-muted'}`}
              onClick={() => setActiveTab('confirmed')}
            >
              Conf <span className="ml-1 opacity-70">{confirmed.length}</span>
            </button>
            <button 
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${activeTab === 'rejected' ? 'bg-status-rejected/10 text-status-rejected shadow-sm border border-status-rejected/20' : 'text-muted-foreground hover:bg-muted'}`}
              onClick={() => setActiveTab('rejected')}
            >
              Rej <span className="ml-1 opacity-70">{rejected.length}</span>
            </button>
            <button 
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${activeTab === 'user' ? 'bg-status-user/10 text-status-user shadow-sm border border-status-user/20' : 'text-muted-foreground hover:bg-muted'}`}
              onClick={() => setActiveTab('user')}
            >
              Added <span className="ml-1 opacity-70">{userAdded.length}</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <Check className="h-10 w-10 text-muted/50 mb-3" />
                <p className="text-sm font-medium">All clear</p>
                <p className="text-xs mt-1">No items in this category.</p>
              </div>
            ) : (
              activeList.map(r => (
                <div 
                  key={r.id} 
                  className={`
                    border rounded-xl p-3.5 text-sm transition-all duration-200 cursor-pointer group
                    ${selectedRedactionId === r.id ? 'border-primary shadow-md bg-primary/5 scale-[1.02]' : 'bg-card hover:border-border hover:shadow-sm'}
                  `}
                  onClick={() => {
                    setSelectedRedactionId(r.id);
                    document.getElementById(`redaction-${r.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  <div className="flex items-start justify-between mb-3 relative">
                    <span className="font-mono bg-muted px-2 py-1 rounded-md text-xs font-medium text-foreground line-clamp-2 leading-relaxed" title={r.text}>
                      {r.text}
                    </span>
                    <Badge variant="outline" className={`capitalize text-[10px] shrink-0 ml-2 ${r.source === 'user' ? 'border-status-user text-status-user' : ''}`}>
                      {r.category}
                    </Badge>
                  </div>
                  
                  {activeTab === "pending" && (
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-status-confirmed hover:bg-status-confirmed/90 text-white font-medium" 
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(r.id, "confirmed"); }}
                      >
                        <Check className="h-4 w-4 mr-1.5" /> Confirm
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-muted-foreground hover:text-status-rejected hover:border-status-rejected" 
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(r.id, "rejected"); }}
                      >
                        <X className="h-4 w-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  )}
                  
                  {activeTab !== "pending" && (
                    <div className="flex justify-between items-center mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Reviewed
                      </span>
                      <div className="flex items-center gap-2">
                        {r.source === 'user' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); handleDeleteRedaction(r.id); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2 text-xs"
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(r.id, "pending"); }}
                        >
                          Undo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
