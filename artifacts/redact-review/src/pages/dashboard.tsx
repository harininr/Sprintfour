import { useState } from "react";
import { useListDocuments, useCreateDocument, useDeleteDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, FileText, AlertCircle, CheckCircle2, Clock, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { data: documents, isLoading } = useListDocuments();
  const createDoc = useCreateDocument();
  const deleteDoc = useDeleteDocument();
  const queryClient = useQueryClient();
  
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createDoc.mutate(
      { data: { title, content } },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle("");
          setContent("");
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        }
      }
    );
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDoc.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
          }
        }
      );
    }
  };

  const totalDocs = documents?.length || 0;
  const inReview = documents?.filter(d => d.status === "in_review").length || 0;
  const completed = documents?.filter(d => d.status === "completed").length || 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold font-serif text-[#1E1E1E]">Redact Review</h1>
            <p className="text-muted-foreground font-sans">Document Privacy Review</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#6B1E2B] text-white hover:bg-[#7D2334]">
                <Plus className="mr-2 h-4 w-4" /> New Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} required className="h-32" />
                </div>
                <Button type="submit" disabled={createDoc.isPending} className="bg-[#6B1E2B] text-white hover:bg-[#7D2334]">
                  {createDoc.isPending ? "Creating..." : "Create"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Documents", value: totalDocs },
            { label: "In Review", value: inReview },
            { label: "Completed", value: completed },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-xl border border-[#E5DDD2] shadow-sm p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-serif text-4xl text-[#1E1E1E]"
              >
                {stat.value}
              </motion.div>
              <div className="font-sans text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-[#E5DDD2] rounded-2xl h-48"></div>
            ))}
          </div>
        ) : !documents?.length ? (
          <div className="text-center py-24">
            <ShieldAlert className="mx-auto h-12 w-12 text-[#1E1E1E] mb-4 opacity-50" />
            <h3 className="font-serif text-2xl text-[#1E1E1E]">No documents</h3>
            <p className="font-sans text-[#666666] mt-2">Upload a document to start reviewing redactions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {documents.map(doc => {
                const isCompleted = doc.status === "completed";
                const progress = doc.totalRedactions > 0 ? ((doc.totalRedactions - doc.pendingCount) / doc.totalRedactions) * 100 : 100;
                
                return (
                  <motion.div 
                    key={doc.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
                    transition={{ duration: 0.15 }}
                    className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-2xl shadow-sm p-6 flex flex-col relative group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-serif font-medium text-[#1E1E1E] line-clamp-2 pr-8">{doc.title}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-sm">
                          {isCompleted ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 text-[#4C7A53]" /> <span className="text-[#4C7A53]">Completed</span></>
                          ) : doc.status === "in_review" ? (
                            <><AlertCircle className="h-3.5 w-3.5 text-[#C58B30]" /> <span className="text-[#C58B30]">In Review</span></>
                          ) : (
                            <><Clock className="h-3.5 w-3.5 text-gray-500" /> <span className="text-gray-500">Pending</span></>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-[#A92B2B]"
                        onClick={(e) => handleDelete(doc.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex-1 space-y-4 mb-6">
                      <div className="space-y-1.5">
                        <div className="h-1 w-full bg-[#E5DDD2] rounded-full overflow-hidden">
                          <div className="h-full bg-[#6B1E2B] transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666666]">Total redactions:</span>
                        <span className="font-medium text-[#1E1E1E] text-right">{doc.totalRedactions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666666]">Pending review:</span>
                        <span className="font-medium text-[#1E1E1E] text-right">{doc.pendingCount}</span>
                      </div>
                    </div>

                    <Button asChild variant={isCompleted ? "outline" : "default"} className={`w-full ${isCompleted ? 'border-[#E5DDD2] text-[#1E1E1E]' : 'bg-[#6B1E2B] text-white hover:bg-[#7D2334]'}`}>
                      <Link href={isCompleted ? `/review/${doc.id}/complete` : `/review/${doc.id}`}>
                        {isCompleted ? "View Summary" : doc.status === "in_review" ? "Continue Review" : "Start Review"}
                      </Link>
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}