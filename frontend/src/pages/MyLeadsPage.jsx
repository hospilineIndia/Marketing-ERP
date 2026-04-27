import { useEffect, useState } from "react";
import { ArrowUpRight, Clock3, Sparkles, Phone, Building2, AlertCircle, Search, X, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLeads, searchLeads } from "@/services/api";

export function MyLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Search State
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Helper: Highlight Search Match (Only if 2+ chars)
  function highlightText(text, query) {
    if (!query || !text || query.trim().length < 2) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase()
        ? <span key={index} className="font-black text-teal-700 bg-teal-50 px-0.5 rounded">{part}</span>
        : part
    );
  }

  const resetLeadsState = () => {
    setLeads([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  };

  const loadInitialLeads = async (silent = false) => {
    try {
      if (!silent) setLoadingInitial(true);
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

  // Search Implementation with Debounce & Min Length
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setIsSearching(false);
      // Requirement: Reset to normal view without losing focus
      // We use 'silent' load to avoid triggering the full-page spinner
      if (query.trim().length === 0 || isSearching) {
        loadInitialLeads(true); 
      }
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setIsSearching(true);
        // We don't set loadingInitial(true) here to prevent the full-page remount
        const response = await searchLeads(query);
        setLeads(response.data || []);
        setHasMore(false);
        setError(null);
      } catch (err) {
        setError("Search failed");
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Pagination Handler
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || isSearching) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await getLeads(nextPage);
      
      setLeads((prev) => [...prev, ...response.data]);
      setHasMore(response.pagination.hasMore);
      setPage(nextPage);
    } catch (err) {
      setError("Failed to load more leads.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setIsSearching(false);
    resetLeadsState();
    loadInitialLeads(true);
  };

  // --- RENDERING ---

  // Global Error State
  if (error && leads.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 py-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="font-medium text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  // Initial Sync Loader (Only for first load)
  if (loadingInitial && leads.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm font-medium text-muted-foreground">Syncing your leads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32 overflow-x-hidden max-w-full">
      {/* Header Summary Card */}
      <Card className="border-none bg-emerald-50/50 shadow-none">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">
              {isSearching ? "Search Results" : "Portfolio"}
            </p>
            <h2 className="text-2xl font-black text-emerald-900">
              {leads.length} Records
            </h2>
          </div>
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Search Bar UI - Persists even during loading to prevent focus loss */}
      <div className="relative group px-1">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search name or company..."
          className="h-12 pl-12 pr-12 rounded-2xl border-none bg-muted/50 focus-visible:ring-primary shadow-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button 
            onClick={handleClearSearch}
            className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Lead List Content */}
      <div className="space-y-4 relative">
        {/* Subtle inline loader for searches/resets */}
        {loadingInitial && leads.length > 0 && (
          <div className="absolute inset-x-0 -top-2 flex justify-center">
             <div className="h-1 w-24 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-progress-loading" />
             </div>
          </div>
        )}

        {leads.map((lead) => (
          <Card key={lead.id} className="group transition-all hover:border-primary/50 hover:shadow-md border-muted/30">
            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                    {highlightText(lead.name, query)}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 font-semibold text-primary/80">
                    <Building2 className="h-3.5 w-3.5" />
                    {highlightText(lead.company || "Individual", query)}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-background font-bold text-[10px] uppercase tracking-tighter flex items-center gap-1">
                  {lead.last_activity_type === 'call' ? <Phone className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                  {lead.last_activity_type === 'call' ? 'Call' : 'Field'}
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
                  Added {new Date(lead.created_at).toLocaleDateString(undefined, { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-primary cursor-pointer hover:underline">
                  DETAILS
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty States */}
      {!loadingInitial && leads.length === 0 && (
        <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-gray-500 text-lg font-black italic">
            {isSearching ? "No matches found" : "No leads yet"}
          </p>
          <p className="text-sm text-gray-400 mt-2 font-medium">
            {isSearching 
              ? "Try a different keyword" 
              : "Start by adding your first lead"}
          </p>
        </div>
      )}

      {/* Pagination Action */}
      {!isSearching && hasMore && (
        <div className="pt-4 px-2">
          <Button 
            variant="secondary" 
            className="w-full font-bold shadow-sm h-12 rounded-xl" 
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
