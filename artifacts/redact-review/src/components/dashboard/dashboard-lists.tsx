import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { 
  FileText, Search, Filter, LayoutGrid, List as ListIcon, 
  MoreVertical, Clock, CheckCircle2, ShieldAlert, ArrowRight,
  ShieldCheck, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const CARD_CLASSES = "bg-[#FFFDF9] border border-[#E5DDD2] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300";
const TEXT_H = "font-serif text-[#1E1E1E]";

export const RecentDocuments = ({ documents, onDelete }: { documents: any[], onDelete: (id: string, e: React.MouseEvent) => void }) => {
  const [view, setView] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");

  const filteredDocs = documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`${CARD_CLASSES}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h3 className={`${TEXT_H} text-xl font-semibold flex items-center gap-2`}>
          <FileText className="h-5 w-5 text-[#6B1E2B]" /> Recent Documents
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1E1E1E]/40" />
            <Input 
              placeholder="Search documents... (Ctrl+K)" 
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#F5F1EA] border-[#E5DDD2] w-64 rounded-full"
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-full border-[#E5DDD2] text-[#1E1E1E]/70"><Filter className="h-4 w-4" /></Button>
          <div className="flex items-center bg-[#F5F1EA] rounded-full p-1 border border-[#E5DDD2]">
            <button onClick={() => setView("grid")} className={`p-1.5 rounded-full ${view === 'grid' ? 'bg-white shadow-sm' : 'text-[#1E1E1E]/50 hover:text-[#1E1E1E]'}`}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView("list")} className={`p-1.5 rounded-full ${view === 'list' ? 'bg-white shadow-sm' : 'text-[#1E1E1E]/50 hover:text-[#1E1E1E]'}`}><ListIcon className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
        <AnimatePresence>
          {filteredDocs.slice(0, 6).map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className={`group flex ${view === 'grid' ? 'flex-col' : 'items-center justify-between'} bg-white border border-[#E5DDD2] rounded-xl p-4 hover:border-[#6B1E2B]/40 transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${doc.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {doc.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className="font-medium text-[#1E1E1E] truncate max-w-[200px]">{doc.title}</h4>
                  <div className="text-xs text-[#1E1E1E]/50 mt-1">
                    {new Date(doc.updatedAt).toLocaleDateString()} • {doc.totalRedactions} total detections
                  </div>
                </div>
              </div>
              
              {view === 'grid' && <div className="mt-4 mb-2"><Progress value={doc.status === 'completed' ? 100 : doc.pendingCount === 0 ? 10 : ((doc.totalRedactions - doc.pendingCount) / Math.max(1, doc.totalRedactions)) * 100} className="h-1.5 bg-[#F5F1EA] [&>div]:bg-[#6B1E2B]" /></div>}

              <div className={`flex items-center gap-2 ${view === 'grid' ? 'justify-between mt-auto pt-2' : ''}`}>
                {doc.status === 'completed' ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Ready</Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{doc.pendingCount} Pending</Badge>
                )}
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/review/${doc.id}`}>
                    <Button size="sm" variant="ghost" className="text-[#6B1E2B] hover:bg-[#F5F1EA]">Review <ArrowRight className="ml-1 h-3 w-3" /></Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredDocs.length === 0 && (
          <div className="py-12 text-center text-[#1E1E1E]/50">No documents found matching "{search}"</div>
        )}
      </div>
    </div>
  );
};

export const ReviewQueue = ({ queue }: { queue: any[] }) => {
  return (
    <div className={`${CARD_CLASSES}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`${TEXT_H} text-xl font-semibold flex items-center gap-2`}>
          <ShieldAlert className="h-5 w-5 text-[#6B1E2B]" /> Priority Review Queue
        </h3>
        <Badge variant="outline" className="bg-[#F5F1EA] text-[#1E1E1E]/80 border-[#E5DDD2]">{queue.filter(q => q.severity === 'critical').length} Critical Pending</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[#1E1E1E]/60 uppercase bg-[#F5F1EA]/50">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Entity</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Source Document</th>
              <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
            </tr>
          </thead>
          <tbody>
            {queue.slice(0, 10).map((item, i) => (
              <motion.tr 
                key={item.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="border-b border-[#E5DDD2]/50 hover:bg-[#F5F1EA]/30 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-[#1E1E1E]">{item.text}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`capitalize
                    ${item.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                    ${item.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                    ${item.severity === 'medium' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                    ${item.severity === 'low' ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                  `}>
                    {item.category}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-[#1E1E1E]/70">
                    <div className={`h-1.5 w-1.5 rounded-full ${item.confidenceScore >= 0.8 ? 'bg-emerald-500' : item.confidenceScore >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`} />
                    {item.confidenceScore >= 0.8 ? 'High' : item.confidenceScore >= 0.5 ? 'Medium' : 'Low'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#1E1E1E]/60 max-w-[150px] truncate">{item.docTitle}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/review/${item.documentId}`}>
                    <Button size="sm" variant="ghost" className="text-[#6B1E2B] hover:bg-[#F5F1EA] h-8">Review</Button>
                  </Link>
                </td>
              </motion.tr>
            ))}
            {queue.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#1E1E1E]/50">No pending items in queue</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
