import { useEffect, useState } from "react";
import { ArrowUpRight, Clock3, Sparkles, Phone, Building2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLeads } from "@/services/api";

export function MyLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const resetLeadsState = () => {
    setLeads([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  };

  const loadInitialLeads = async () => {
    try {
      setLoadingInitial(true);
      setError(null);
      const response = await getLeads(1);
      
      if (!response || !response.data) {
        setError("Failed to load leads");
        return;
      }

      setError(null);
      setLeads(response.data);
      setHasMore(response.pagination?.hasMore || false);
      setPage(1);
    } catch (err) {
      setError("Failed to load leads. Please try again.");
    } finally {
      setLoadingInitial(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadInitialLeads();
  }, []);

  // Pagination Handler
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await getLeads(nextPage);
      
      setLeads((prev) => [...prev, ...response.data]);
      setHasMore(response.pagination.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Rendering Logic (Priority: Loading > Error > Empty > List)
  if (loadingInitial) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm font-medium text-muted-foreground">Syncing your leads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 py-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="font-medium text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg font-medium">No leads yet</p>
        <p className="text-sm text-gray-400 mt-2">Start by adding your first lead</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header Summary Card */}
      <Card className="border-none bg-emerald-50/50 shadow-none">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Portfolio</p>
            <h2 className="text-2xl font-black text-emerald-900">
              {leads.length} Records
            </h2>
          </div>
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Lead List */}
      <div className="space-y-4">
        {leads.map((lead) => (
          <Card key={lead.id} className="group transition-all hover:border-primary/50 hover:shadow-md">
            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                    {lead.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 font-semibold text-primary/80">
                    <Building2 className="h-3.5 w-3.5" />
                    {lead.company || "Individual"}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-background font-bold text-[10px] uppercase tracking-tighter">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="rounded-full bg-emerald-100 p-1.5 text-emerald-700">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <span>{lead.phone || "No contact"}</span>
              </div>
              
              <div className="flex items-center justify-between border-t border-dashed pt-4 text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground font-medium">
                  <Clock3 className="h-3.5 w-3.5" />
                  {/* Requirement 5: Human readable date */}
                  Added {new Date(lead.created_at).toLocaleDateString(undefined, { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-primary cursor-pointer hover:underline">
                  OPEN
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Action */}
      {hasMore && (
        <div className="pt-4 px-2">
          <Button 
            variant="secondary" 
            className="w-full font-bold shadow-sm" 
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Fetching next page..." : "Show More Results"}
          </Button>
        </div>
      )}

    </div>
  );
}
