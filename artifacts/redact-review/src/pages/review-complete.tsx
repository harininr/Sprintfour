import { useParams, Link } from "wouter";
import { useGetDocumentSummary, getGetDocumentSummaryQueryKey } from "@workspace/api-client-react";
import { ShieldCheck, ArrowLeft, Download, AlertCircle, FileText, CheckCircle2, Loader2, Bot, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

interface EngineResult {
  issues: number;
  label: string;
}

interface ScanResult {
  safe: boolean;
  issues: Array<{ text: string; reason: string; detectedBy: string[] }>;
  engineResults: {
    gemini: EngineResult;
    groq: EngineResult;
    openrouter: EngineResult;
  };
  totalRedactions: number;
  verificationHash: string;
}

export default function ReviewComplete() {
  const params = useParams();
  const id = params.id as string;
  const { data: summary, isLoading } = useGetDocumentSummary(id, {
    query: { enabled: !!id, queryKey: getGetDocumentSummaryQueryKey(id) },
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanStage, setScanStage] = useState<"idle" | "scanning" | "done">("idle");
  const [currentEngine, setCurrentEngine] = useState<string>("");

  const ENGINES = [
    { key: "gemini", label: "Gemini 2.5 Flash", org: "Google DeepMind" },
    { key: "groq", label: "Groq Llama 3.3 70B", org: "Groq" },
    { key: "openrouter", label: "Claude 3 Haiku", org: "OpenRouter" },
  ];

  const runSafetyScan = async () => {
    setIsScanning(true);
    setScanStage("scanning");

    // Simulate per-engine progress for UX
    for (const engine of ENGINES) {
      setCurrentEngine(engine.label);
      await new Promise(r => setTimeout(r, 900));
    }
    setCurrentEngine("");

    try {
      const res = await fetch(`/api/documents/${id}/safety-scan`, { method: "POST" });
      const data: ScanResult = await res.json();
      setScanResult(data);
      setScanStage("done");
      if (data.safe) {
        toast.success("Final Safety Scan Passed", { description: "All 3 engines confirmed: no critical PII remaining." });
      } else {
        toast.error("Issues Detected", { description: `${data.issues.length} missed PII item(s) found.` });
      }
    } catch {
      toast.error("Scan Failed");
      setScanStage("idle");
    } finally {
      setIsScanning(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="min-h-screen bg-[#F5F1EA] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#1E1E1E]/60">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-serif">Loading review summary...</span>
        </div>
      </div>
    );
  }

  const riskColor =
    summary.riskScore < 20 ? "text-[#4C7A53]" :
    summary.riskScore < 50 ? "text-[#C58B30]" :
    "text-[#A92B2B]";

  return (
    <div className="min-h-screen bg-[#F5F1EA] flex flex-col">
      {/* Header */}
      <header className="h-16 shrink-0 border-b border-[#E8DED1] bg-[#FFFDF9] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Redact Review Logo" className="h-5 w-auto object-contain" />
          <h1 className="font-serif font-semibold text-[#1E1E1E] text-lg">Redact Review</h1>
        </div>
        <Button asChild variant="ghost" className="text-[#666666]">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </header>

      <main className="flex-1 flex items-start justify-center p-8 gap-8">
        {/* Left: Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-[400px] bg-[#FFFDF9] border border-[#E5DDD2] rounded-3xl shadow-xl p-8 shrink-0"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#6B1E2B]/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-[#6B1E2B]" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#1E1E1E]">Review Complete</h2>
            <p className="text-[#888] text-sm mt-2">All identified PII has been processed.</p>

            {/* Risk Score Ring */}
            <div className={`mt-6 w-20 h-20 rounded-full border-4 flex items-center justify-center font-serif text-2xl font-medium ${riskColor} border-current`}>
              {summary.riskScore.toFixed(0)}
            </div>
            <p className="text-xs text-[#888] mt-2">Final Risk Score</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Confirmed", value: summary.confirmedCount, color: "text-[#4C7A53]" },
              { label: "Rejected", value: summary.rejectedCount, color: "text-[#A92B2B]" },
              { label: "Added by You", value: summary.userAddedCount, color: "text-[#6B1E2B]" },
            ].map(s => (
              <div key={s.label} className="bg-[#F5F1EA] rounded-2xl p-4 text-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className={`font-serif text-2xl font-bold ${s.color}`}
                >
                  {s.value}
                </motion.div>
                <div className="text-[11px] text-[#888] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Category Breakdown */}
          {summary.categoryBreakdown?.length > 0 && (
            <div className="mb-6">
              <h3 className="uppercase tracking-widest text-[10px] text-[#888] mb-4 flex items-center gap-2">
                <BarChart2 className="h-3 w-3" /> Category Breakdown
              </h3>
              <div className="space-y-3">
                {summary.categoryBreakdown.map((cat, i) => {
                  const maxCount = Math.max(...summary.categoryBreakdown.map(c => c.count));
                  const percent = (cat.count / maxCount) * 100;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="capitalize text-xs text-[#1E1E1E] w-20 truncate">{cat.category}</span>
                      <div className="h-1.5 rounded-full bg-[#E5DDD2] flex-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.7, delay: i * 0.05 }}
                          className="h-full bg-[#6B1E2B] rounded-full"
                        />
                      </div>
                      <span className="text-xs font-medium text-[#1E1E1E] w-6 text-right">{cat.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button asChild variant="link" className="w-full text-[#888] hover:text-[#1E1E1E] text-xs mt-2">
            <Link href="/">Return to Dashboard</Link>
          </Button>
        </motion.div>

        {/* Right: Final Safety Scan Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 max-w-[640px] bg-[#FFFDF9] border border-[#E5DDD2] rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Scan Header */}
          <div className="px-8 py-6 border-b border-[#E5DDD2]">
            <h3 className="font-serif text-xl font-semibold text-[#1E1E1E] mb-1">Final Safety Scan</h3>
            <p className="text-sm text-[#888]">
              Re-scan the redacted document with all 3 AI engines to confirm nothing was missed.
            </p>
          </div>

          <div className="p-8">
            {/* Engine Status List */}
            <div className="space-y-3 mb-8">
              {ENGINES.map(engine => {
                const result = scanResult?.engineResults[engine.key as keyof typeof scanResult.engineResults];
                const isActive = currentEngine === engine.label && isScanning;
                const isDone = scanStage === "done";

                return (
                  <motion.div
                    key={engine.key}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                      isActive
                        ? "bg-[#6B1E2B]/5 border-[#6B1E2B]/30"
                        : isDone
                        ? "bg-[#F5F1EA] border-[#E5DDD2]"
                        : "bg-[#F5F1EA] border-[#E5DDD2]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                        isActive ? "bg-[#6B1E2B]/10" :
                        isDone ? (result && result.issues === 0 ? "bg-emerald-50" : "bg-red-50") :
                        "bg-white/60"
                      }`}>
                        {isActive ? (
                          <Loader2 className="h-4 w-4 text-[#6B1E2B] animate-spin" />
                        ) : isDone ? (
                          result && result.issues === 0
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            : <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Bot className="h-4 w-4 text-[#aaa]" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#1F1F1F]">{engine.label}</div>
                        <div className="text-[11px] text-[#888]">{engine.org}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {isActive && (
                        <span className="text-[11px] text-[#6B1E2B] font-medium animate-pulse">Scanning...</span>
                      )}
                      {isDone && result && (
                        <div>
                          <span className={`text-sm font-bold ${result.issues === 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {result.issues === 0 ? "Clean" : `${result.issues} issue${result.issues > 1 ? "s" : ""}`}
                          </span>
                          <div className="text-[10px] text-[#aaa]">{result.issues === 0 ? "No missed PII" : "Missed PII found"}</div>
                        </div>
                      )}
                      {!isActive && !isDone && (
                        <span className="text-[11px] text-[#bbb]">Standby</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Results area */}
            <AnimatePresence mode="wait">
              {scanStage === "idle" && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Button
                    className="w-full bg-[#6B1E2B] hover:bg-[#7D2334] text-white h-13 rounded-2xl text-base font-semibold shadow-md py-4"
                    onClick={runSafetyScan}
                  >
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Run Final Safety Scan (3 Engines)
                  </Button>
                  <p className="text-center text-[11px] text-[#aaa] mt-3">
                    This will analyse the redacted document using Gemini, Groq, and OpenRouter simultaneously.
                  </p>
                </motion.div>
              )}

              {scanStage === "scanning" && (
                <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-[#6B1E2B] mx-auto mb-2" />
                  <p className="text-sm text-[#888]">
                    {currentEngine ? `Running ${currentEngine}...` : "Aggregating results..."}
                  </p>
                </motion.div>
              )}

              {scanStage === "done" && scanResult && (
                <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  {/* Verification Hash */}
                  <div className="bg-[#F5F1EA] rounded-2xl p-4 mb-5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-[#888] font-mono">Verification Hash</span>
                      <span className="text-[11px] text-[#6B1E2B] font-mono font-bold">{scanResult.verificationHash}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-[#888] font-mono">Total Redactions Applied</span>
                      <span className="text-[11px] font-bold text-[#1F1F1F]">{scanResult.totalRedactions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-[#888] font-mono">HIPAA Compliance</span>
                      <span className={`text-[11px] font-bold flex items-center gap-1 ${scanResult.safe ? "text-emerald-600" : "text-amber-600"}`}>
                        <CheckCircle2 className="h-3 w-3" />
                        {scanResult.safe ? "VALID" : "REVIEW NEEDED"}
                      </span>
                    </div>
                  </div>

                  {/* Issues */}
                  {!scanResult.safe && scanResult.issues.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <h4 className="text-sm font-semibold text-red-700">
                          {scanResult.issues.length} Missed PII Item{scanResult.issues.length > 1 ? "s" : ""} Found
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {scanResult.issues.map((issue, i) => (
                          <div key={i} className="bg-white rounded-xl p-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-mono text-xs text-red-800 bg-red-50 px-2 py-0.5 rounded">"{issue.text}"</span>
                              <div className="flex gap-1 shrink-0">
                                {issue.detectedBy?.map(e => (
                                  <span key={e} className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">{e.split(" ")[0]}</span>
                                ))}
                              </div>
                            </div>
                            <p className="text-[11px] text-red-700 mt-1.5">{issue.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {scanResult.safe && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm text-emerald-700">Document is clean and safe to export</h4>
                        <p className="text-xs text-emerald-600 mt-1">All 3 engines confirmed no remaining critical PII.</p>
                      </div>
                    </div>
                  )}

                  {/* Export Actions */}
                  <div className="flex gap-3">
                    {!scanResult.safe && (
                      <Button asChild variant="outline" className="flex-1 border-[#E5DDD2] text-[#1E1E1E] h-11 rounded-xl">
                        <Link href={`/review/${id}`}>Review Again</Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" className="flex-1 border-[#E5DDD2] h-11 rounded-xl text-[#666]">
                      <a href={`/api/documents/${id}/export`} target="_blank" rel="noreferrer">
                        <FileText className="h-4 w-4 mr-2" /> Audit Report
                      </a>
                    </Button>
                    <Button asChild className="flex-1 bg-[#6B1E2B] text-white hover:bg-[#7D2334] rounded-xl h-11">
                      <a href={`/api/documents/${id}/export-redacted`} target="_blank" rel="noreferrer">
                        <Download className="h-4 w-4 mr-2" /> Export Redacted Doc
                      </a>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}