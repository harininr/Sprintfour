import { useState, useRef, useCallback, useEffect } from "react";
import { useListDocuments, useCreateDocument, useDeleteDocument, getListDocumentsQueryKey, getListRedactionsQueryOptions } from "@workspace/api-client-react";
import { useQueryClient, useQueries } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Plus, AlertCircle, CheckCircle2, Clock, Trash2, ShieldAlert, Upload, FileText, Type, X, File, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
// Import our new modular components
import { 
  HeroSection, QuickStatistics, TrustMeter, PrivacyIntelligence, 
  AIAnalytics, PIIBreakdown, SmartInsights, ActivityTimeline, 
  ComplianceChecklist 
} from "../components/dashboard/dashboard-components";
import { RecentDocuments, ReviewQueue } from "../components/dashboard/dashboard-lists";

type Tab = "upload" | "text";

const ACCEPTED = ".docx,.doc,.txt,.md,.text";
const ACCEPTED_MIMES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Dashboard() {
  const { data: documents, isLoading } = useListDocuments();
  const createDoc = useCreateDocument();
  const deleteDoc = useDeleteDocument();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  
  // Protect the dashboard route
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const safeDocuments = Array.isArray(documents) ? documents : [];

  const redactionQueries = useQueries({
    queries: safeDocuments.map(doc => getListRedactionsQueryOptions(doc.id))
  });

  const allRedactions = redactionQueries.flatMap((q, index) => {
    return (q.data || []).map(r => ({
      ...r,
      docTitle: safeDocuments[index]?.title || "Unknown",
      confidenceScore: r.confidence
    }));
  });

  const [open, setOpen] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("upload");

  // Text tab state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Upload tab state
  const [file, setFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auditor widget state
  const [auditorOpen, setAuditorOpen] = useState(false);
  const [allDocsOpen, setAllDocsOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetDialog = () => {
    setTitle("");
    setContent("");
    setFile(null);
    setUploadTitle("");
    setUploadError(null);
    setTextError(null);
    setDragging(false);
    setUploading(false);
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) resetDialog();
  };

  const handleTextCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setTextError(null);
    createDoc.mutate(
      { data: { title, content } },
      {
        onSuccess: (newDoc: any) => {
          handleOpenChange(false);
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
          if (newDoc?.id) setLocation(`/review/${newDoc.id}`);
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : String(err);
          setTextError(msg || "Failed to create document. Check your connection and try again.");
        },
      }
    );
  };

  const pickFile = (f: File) => {
    setFile(f);
    setUploadTitle(prev => prev || f.name.replace(/\.[^.]+$/, ""));
    setUploadError(null);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }, []);

  const handleUploadCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (uploadTitle.trim()) formData.append("title", uploadTitle.trim());

      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Upload failed (${res.status})`);
      }

      const newDoc = await res.json().catch(() => null);
      handleOpenChange(false);
      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      if (newDoc?.id) setLocation(`/review/${newDoc.id}`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDoc.mutate(
        { id },
        { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() }); } }
      );
    }
  };

  const totalDocs = safeDocuments.length;
  const inReview = safeDocuments.filter(d => d.status === "in_review").length;
  const completed = safeDocuments.filter(d => d.status === "completed").length;
  const pendingDocs = safeDocuments.filter(d => d.status === "pending").length;
  
  const totalRedactions = safeDocuments.reduce((acc, doc) => acc + doc.totalRedactions, 0);
  const pendingRedactions = safeDocuments.reduce((acc, doc) => acc + doc.pendingCount, 0);

  // Derived real data for statistics
  const readinessScore = totalRedactions > 0 ? Math.round(((totalRedactions - pendingRedactions) / totalRedactions) * 100) : 100;
  const riskLevel = pendingRedactions > 20 ? "High" : pendingRedactions > 5 ? "Medium" : "Low";

  // Compute Real Data for Components
  const categories = ["name", "email", "phone", "address", "ssn", "dob", "financial", "medical", "organization", "other"];
  const piiBreakdown = categories.map(cat => ({
    name: cat,
    count: allRedactions.filter(r => r.category === cat).length
  })).filter(c => c.count > 0).sort((a,b) => b.count - a.count);

  const aiStats = [
    { name: "High Confidence", count: allRedactions.filter(r => r.confidence >= 0.8).length, color: "bg-emerald-500" },
    { name: "Medium Confidence", count: allRedactions.filter(r => r.confidence >= 0.5 && r.confidence < 0.8).length, color: "bg-amber-500" },
    { name: "Low Confidence", count: allRedactions.filter(r => r.confidence < 0.5).length, color: "bg-red-500" },
  ];

  const reviewQueue = allRedactions
    .filter(r => r.status === "pending")
    .sort((a,b) => b.confidence - a.confidence)
    .map(r => ({
      ...r,
      severity: ["ssn", "financial"].includes(r.category) ? "critical" : ["medical", "phone", "dob"].includes(r.category) ? "high" : ["address", "email"].includes(r.category) ? "medium" : "low"
    }));

  const confirmed = allRedactions.filter(r => r.status === "confirmed" || r.status === "user_added").length;
  const overallScore = allRedactions.length === 0 ? "A+" : (confirmed / allRedactions.length) > 0.9 ? "A" : (confirmed / allRedactions.length) > 0.7 ? "B" : "C";
  const intelligenceSummaries = [
    { label: "Overall Privacy Score", value: overallScore, desc: allRedactions.length === 0 ? "No risks detected" : "Based on confirmed items" },
    { label: "Export Readiness", value: `${allRedactions.length === 0 ? 100 : Math.round((confirmed/allRedactions.length)*100)}%`, desc: `${completed} docs ready` },
    { label: "Compliance Status", value: pendingRedactions === 0 ? "Pass" : "Review needed", desc: "HIPAA / GDPR checks" },
  ];

  const insights = [];
  const unreviewedCritical = allRedactions.filter(r => ["ssn", "financial"].includes(r.category) && r.status === "pending").length;
  if (unreviewedCritical > 0) insights.push({ title: "Unreviewed Critical PII", desc: `There are ${unreviewedCritical} critical identifiers awaiting review.`, priority: "high" });
  
  const lowConfidence = allRedactions.filter(r => r.confidence < 0.5 && r.status === "pending").length;
  if (lowConfidence > 0) insights.push({ title: "Low Confidence Detections", desc: `${lowConfidence} items have low confidence and need manual checking.`, priority: "medium" });

  const emails = allRedactions.filter(r => r.category === "email" && r.status === "pending").length;
  if (emails > 0) insights.push({ title: "Pending Emails", desc: `${emails} emails have been detected but not reviewed.`, priority: "low" });

  const checklistItems = categories.slice(0, 6).map(cat => {
    const totalCat = allRedactions.filter(r => r.category === cat).length;
    const pendingCat = allRedactions.filter(r => r.category === cat && r.status === "pending").length;
    return {
      label: cat,
      status: totalCat === 0 ? "complete" : pendingCat === 0 ? "complete" : pendingCat === totalCat ? "incomplete" : "review"
    };
  });

  const recentDocs = [...safeDocuments].sort((a,b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  const activities = recentDocs.slice(0, 5).map(d => ({
    time: new Date(d.updatedAt || 0).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    text: d.status === "completed" ? `Document '${d.title}' review completed` : `Document '${d.title}' updated`
  }));

  const isBusy = uploading || createDoc.isPending;

  return (
    <div className="min-h-screen bg-[#F5F1EA] text-[#1E1E1E] font-sans relative overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-[#FFFDF9]/80 backdrop-blur-md border-b border-[#E5DDD2] px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Redact Review Logo" className="h-6 w-auto object-contain" />
            <span className="font-serif font-bold text-xl text-[#1E1E1E]">Redact Review</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:flex text-[#1E1E1E]/70 hover:text-[#1E1E1E] hover:bg-[#F5F1EA]" onClick={() => setAllDocsOpen(true)}>All Documents</Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-[#E8DED1]">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                      <AvatarFallback className="bg-[#6B1E2B] text-white">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-[#1F1F1F]">{user.name}</p>
                      <p className="text-xs leading-none text-[#666]">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    logout();
                    setLocation("/");
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => setLocation("/login")} className="bg-[#6B1E2B] hover:bg-[#521721] text-white">Sign In</Button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
        
        {/* SECTION 1: HERO */}
        <HeroSection onUploadClick={() => setOpen(true)} onAuditorClick={() => setAuditorOpen(true)} />

        {/* SECTION 2: QUICK STATS */}
        <QuickStatistics stats={{
          readiness: readinessScore,
          overallRisk: riskLevel,
          reviewed: completed,
          pending: inReview + pendingDocs
        }} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* SECTION 5: PRIVACY INTELLIGENCE */}
            <div className="flex flex-col sm:flex-row gap-6">
              <PrivacyIntelligence summaries={intelligenceSummaries} />
              <div className="w-full sm:w-1/3">
                <TrustMeter score={readinessScore} />
              </div>
            </div>

            {/* SECTION 4: RECENT DOCUMENTS */}
            <RecentDocuments documents={safeDocuments} onDelete={handleDelete} />

            {/* SECTION 6: REVIEW QUEUE */}
            <ReviewQueue queue={reviewQueue} />

            {/* SECTION 8: PII BREAKDOWN */}
            <PIIBreakdown pii={piiBreakdown} />
          </div>

          <div className="space-y-6 sm:space-y-8">
            {/* SECTION 7: AI ANALYTICS */}
            <AIAnalytics stats={aiStats} total={allRedactions.length} />

            {/* SECTION 9 & 10: SMART INSIGHTS & REC ACTIONS */}
            <SmartInsights insights={insights} />

            {/* SECTION 11: COMPLIANCE CHECKLIST */}
            <ComplianceChecklist items={checklistItems} />

            {/* SECTION 12 & 13: ACTIVITY TIMELINE */}
            <ActivityTimeline activities={activities} />
          </div>
        </div>

      </div>

      {/* Upload Dialog Component */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg bg-[#FFFDF9] border border-[#E5DDD2] rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add Document</DialogTitle>
          </DialogHeader>

          {/* Tab Switcher */}
          <div className="flex rounded-lg border border-[#E5DDD2] overflow-hidden mb-4 bg-[#F5F1EA]">
            <button
              type="button"
              onClick={() => setTab("upload")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${tab === "upload" ? "bg-[#6B1E2B] text-white shadow" : "bg-transparent text-[#1E1E1E]/60 hover:bg-[#E5DDD2]/50 hover:text-[#1E1E1E]"}`}
            >
              <Upload className="h-4 w-4" /> Upload File
            </button>
            <button
              type="button"
              onClick={() => setTab("text")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${tab === "text" ? "bg-[#6B1E2B] text-white shadow" : "bg-transparent text-[#1E1E1E]/60 hover:bg-[#E5DDD2]/50 hover:text-[#1E1E1E]"}`}
            >
              <Type className="h-4 w-4" /> Paste Text
            </button>
          </div>

          {/* Upload Tab */}
          {tab === "upload" && (
            <form onSubmit={handleUploadCreate} className="space-y-4">
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer
                  ${file ? "border-[#6B1E2B] bg-[#FFFDF9]" : dragging ? "border-[#6B1E2B] bg-[#F5F1EA]" : "border-[#E5DDD2] bg-[#FAFAF8] hover:border-[#6B1E2B]/50 hover:bg-[#F5F1EA]"}
                `}
              >
                <input ref={fileInputRef} type="file" accept={ACCEPTED} className="sr-only" onChange={onFileInputChange} />
                {file ? (
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#6B1E2B]/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[#6B1E2B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1E1E1E] truncate">{file.name}</p>
                      <p className="text-xs text-[#1E1E1E]/60">{formatBytes(file.size)}</p>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null); setUploadTitle(""); }} className="p-1.5 rounded-md hover:bg-[#E5DDD2] text-[#1E1E1E]/50 hover:text-[#1E1E1E]">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F5F1EA] flex items-center justify-center mb-3 text-[#6B1E2B]">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-[#1E1E1E]">Click to upload or drag and drop</p>
                    <p className="text-xs text-[#1E1E1E]/50 mt-1">DOCX, DOC, TXT, MD — up to 20 MB</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="upload-title" className="text-[#1E1E1E]">Document title <span className="text-[#1E1E1E]/50 font-normal">(optional)</span></Label>
                <Input id="upload-title" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Auto-detected from filename" className="bg-[#FFFDF9] border-[#E5DDD2]" />
              </div>

              {uploadError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">{uploadError}</p>}

              <Button type="submit" disabled={!file || isBusy} className="w-full bg-[#6B1E2B] text-white hover:bg-[#7D2334] disabled:opacity-50 h-11 rounded-xl">
                {isBusy ? (
                  <><span className="animate-spin mr-2">⏳</span> Scanning the document, please wait...</>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" /> Upload & Import</>
                )}
              </Button>
            </form>
          )}

          {/* Text Tab */}
          {tab === "text" && (
            <form onSubmit={handleTextCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-[#1E1E1E]">Title</Label>
                <Input id="title" value={title} onChange={e => { setTitle(e.target.value); setTextError(null); }} required className="bg-[#FFFDF9] border-[#E5DDD2]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content" className="text-[#1E1E1E]">Content</Label>
                <Textarea id="content" value={content} onChange={e => { setContent(e.target.value); setTextError(null); }} required className="h-40 font-mono text-sm bg-[#FFFDF9] border-[#E5DDD2]" placeholder="Paste your document text here…" />
              </div>
              {textError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                  <p className="text-sm text-red-700 font-medium">Error saving document</p>
                  <p className="text-xs text-red-600 mt-0.5 break-words">{textError}</p>
                </div>
              )}
              <Button type="submit" disabled={createDoc.isPending} className="w-full bg-[#6B1E2B] text-white hover:bg-[#7D2334] disabled:opacity-60 h-11 rounded-xl">
                {createDoc.isPending ? <><span className="mr-2 inline-block animate-spin">⏳</span> Creating…</> : "Create Document"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* All Documents Modal */}
      <Dialog open={allDocsOpen} onOpenChange={setAllDocsOpen}>
        <DialogContent className="sm:max-w-[900px] bg-[#FFFDF9] border-[#E5DDD2] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between w-full pr-8">
              <DialogTitle className="font-serif text-2xl text-[#1E1E1E]">All Documents</DialogTitle>
              <Button size="sm" onClick={() => { setAllDocsOpen(false); setOpen(true); }} className="bg-[#6B1E2B] text-white hover:bg-[#7D2334]">
                <Plus className="h-4 w-4 mr-1" /> Upload
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 mt-4">
            {safeDocuments.length === 0 ? (
              <p className="text-center text-[#1E1E1E]/60 py-8">No documents found.</p>
            ) : (
              safeDocuments.map(doc => (
                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#F5F1EA] rounded-xl border border-[#E5DDD2] gap-4">
                  <div className="flex items-start gap-3 overflow-hidden">
                    <FileText className="h-5 w-5 text-[#6B1E2B] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h4 className="font-medium text-[#1E1E1E] truncate">{doc.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#1E1E1E]/60">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(doc.createdAt).toLocaleDateString()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                          doc.status === "pending" ? "bg-amber-100 text-amber-800" :
                          doc.status === "in_review" ? "bg-blue-100 text-blue-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {doc.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {confirmDeleteId === doc.id ? (
                      <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                        <span className="text-xs font-medium text-red-700">Delete?</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 px-2 text-red-700 hover:bg-red-100"
                          onClick={() => {
                            deleteDoc.mutate({ id: doc.id }, {
                              onSuccess: () => {
                                queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
                                setConfirmDeleteId(null);
                              },
                              onError: () => setConfirmDeleteId(null)
                            });
                          }}
                          disabled={deleteDoc.isPending}
                        >
                          Yes
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 px-2 text-[#666] hover:bg-gray-200"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deleteDoc.isPending}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Link href={`/review/${doc.id}`}>
                          <Button size="sm" className="bg-[#6B1E2B] text-white hover:bg-[#7D2334]">
                            Review
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setConfirmDeleteId(doc.id)}
                          disabled={deleteDoc.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Privacy Auditor Widget */}
      <AnimatePresence>
        {auditorOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-80 bg-[#FFFDF9] border border-[#E5DDD2] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="bg-[#6B1E2B] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                <span className="font-medium text-sm">AI Privacy Auditor</span>
              </div>
              <button onClick={() => setAuditorOpen(false)} className="text-white/70 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-3 h-64 overflow-y-auto bg-[#F5F1EA]/30">
              <div className="bg-[#E5DDD2]/50 p-3 rounded-lg text-sm text-[#1E1E1E] rounded-tl-none w-[85%]">
                Hello! I can answer questions about your privacy status, document risks, or compliance readiness.
              </div>
              <div className="bg-[#E5DDD2]/50 p-3 rounded-lg text-sm text-[#1E1E1E] rounded-tl-none w-[85%]">
                Try asking: "Are there any unreviewed passports left?" or "Is Q3_Financials safe to share?"
              </div>
            </div>
            <div className="p-3 border-t border-[#E5DDD2] bg-white flex gap-2">
              <Input placeholder="Ask anything..." className="text-sm h-9 bg-[#F5F1EA] border-none" />
              <Button size="icon" className="h-9 w-9 bg-[#6B1E2B] text-white hover:bg-[#7D2334] shrink-0">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}