import { useState } from "react";
import { useListDocuments, useCreateDocument, useDeleteDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, FileText, AlertCircle, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Redact Review</h1>
            <p className="text-muted-foreground">Document PII Redaction Dashboard</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
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
                <Button type="submit" disabled={createDoc.isPending}>
                  {createDoc.isPending ? "Creating..." : "Create"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading documents...</div>
        ) : !documents?.length ? (
          <div className="text-center bg-card rounded-xl border border-dashed py-24">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No documents</h3>
            <p className="text-muted-foreground mt-1">Upload a document to start reviewing redactions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <Card key={doc.id} className="flex flex-col relative group">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="line-clamp-1 pr-8">{doc.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-1">
                        {doc.status === "completed" ? (
                          <><CheckCircle2 className="h-4 w-4 text-status-confirmed" /> Completed</>
                        ) : doc.status === "in_review" ? (
                          <><AlertCircle className="h-4 w-4 text-status-pending" /> In Review</>
                        ) : (
                          <><Clock className="h-4 w-4 text-muted-foreground" /> Pending</>
                        )}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(doc.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end gap-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total redactions:</span>
                    <span className="font-medium">{doc.totalRedactions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending review:</span>
                    <span className="font-medium text-status-pending">{doc.pendingCount}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant={doc.status === "completed" ? "outline" : "default"} className="w-full">
                    <Link href={doc.status === "completed" ? `/review/${doc.id}/complete` : `/review/${doc.id}`}>
                      {doc.status === "completed" ? "View Summary" : doc.status === "in_review" ? "Continue Review" : "Start Review"}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
