import { useParams, Link } from "wouter";
import { useGetDocumentSummary } from "@workspace/api-client-react";
import { ShieldCheck, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ReviewComplete() {
  const params = useParams();
  const id = params.id as string;
  const { data: summary, isLoading } = useGetDocumentSummary(id, { query: { enabled: !!id } });

  if (isLoading || !summary) {
    return <div className="min-h-screen flex items-center justify-center">Loading summary...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <Button asChild variant="ghost" className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="text-center pb-8 pt-10">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Review Complete</CardTitle>
            <CardDescription className="text-base mt-2">
              All identified PII has been processed. Risk score is now {summary.riskScore.toFixed(1)}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-status-confirmed">{summary.confirmedCount}</div>
                <div className="text-sm text-muted-foreground mt-1">Confirmed</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-status-rejected">{summary.rejectedCount}</div>
                <div className="text-sm text-muted-foreground mt-1">Rejected</div>
              </div>
              <div className="p-4 bg-muted rounded-lg border-2 border-status-user/20">
                <div className="text-3xl font-bold text-status-user">{summary.userAddedCount}</div>
                <div className="text-sm text-muted-foreground mt-1">Added by You</div>
              </div>
            </div>

            {summary.categoryBreakdown?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Category Breakdown</h3>
                <div className="space-y-3">
                  {summary.categoryBreakdown.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{cat.category}</span>
                      <span className="font-medium bg-muted px-2 py-1 rounded">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
