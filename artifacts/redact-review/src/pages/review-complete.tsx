import { useParams, Link } from "wouter";
import { useGetDocumentSummary } from "@workspace/api-client-react";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ReviewComplete() {
  const params = useParams();
  const id = params.id as string;
  const { data: summary, isLoading } = useGetDocumentSummary(id, { query: { enabled: !!id } });

  if (isLoading || !summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-serif text-[#1E1E1E]">Loading summary...</div>
      </div>
    );
  }

  const riskColor = summary.riskScore < 20 ? "text-[#4C7A53]" : summary.riskScore < 50 ? "text-[#C58B30]" : "text-[#A92B2B]";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 shrink-0 bg-[#FFFDF9] border-b border-[#E5DDD2] shadow-sm px-4 flex items-center justify-between">
        <h1 className="font-serif font-semibold text-[#1E1E1E] text-lg">Redact Review</h1>
        <Button asChild variant="ghost" className="text-[#666666]">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-[#FFFDF9] border border-[#E5DDD2] rounded-3xl shadow-xl p-10"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#6B1E2B]/10 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-[#6B1E2B]" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-[#1E1E1E] mt-4">Review Complete</h2>
            <p className="text-[#888888] text-base mt-2">All identified PII has been processed.</p>
            
            <div className={`mt-6 w-24 h-24 rounded-full border-4 flex items-center justify-center font-serif text-3xl font-medium ${riskColor} border-current`}>
              {summary.riskScore.toFixed(0)}
            </div>
            <p className="text-sm text-[#666666] mt-2">Final Risk Score</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#F5F1EA] rounded-2xl p-5 text-center">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
                className="font-serif text-3xl text-[#1E1E1E]"
              >
                {summary.confirmedCount}
              </motion.div>
              <div className="text-sm text-[#888888] mt-1 font-sans">Confirmed</div>
            </div>
            <div className="bg-[#F5F1EA] rounded-2xl p-5 text-center">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
                className="font-serif text-3xl text-[#1E1E1E]"
              >
                {summary.rejectedCount}
              </motion.div>
              <div className="text-sm text-[#888888] mt-1 font-sans">Rejected</div>
            </div>
            <div className="bg-[#F5F1EA] rounded-2xl p-5 text-center">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
                className="font-serif text-3xl text-[#1E1E1E]"
              >
                {summary.userAddedCount}
              </motion.div>
              <div className="text-sm text-[#888888] mt-1 font-sans">Added by You</div>
            </div>
          </div>

          {summary.categoryBreakdown?.length > 0 && (
            <div className="mb-6">
              <h3 className="uppercase tracking-widest text-[10px] text-[#888888] mb-4">Category Breakdown</h3>
              <div className="space-y-4">
                {summary.categoryBreakdown.map((cat, i) => {
                  const maxCount = Math.max(...summary.categoryBreakdown.map(c => c.count));
                  const percent = (cat.count / maxCount) * 100;
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span className="capitalize text-sm text-[#1E1E1E] w-24 truncate">{cat.category}</span>
                      <div className="h-1.5 rounded-full bg-[#E5DDD2] relative flex-1 mx-4">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${percent}%` }} 
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="absolute inset-y-0 left-0 bg-[#6B1E2B] rounded-full"
                        />
                      </div>
                      <span className="text-sm font-medium text-[#1E1E1E] w-8 text-right">{cat.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button asChild className="w-full bg-[#6B1E2B] text-white hover:bg-[#7D2334] rounded-xl h-11 mt-6 font-medium">
            <Link href="/">Return to Dashboard</Link>
          </Button>
        </motion.div>
      </main>
    </div>
  );
}