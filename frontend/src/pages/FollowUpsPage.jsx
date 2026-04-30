import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, CheckCircle2, AlertCircle, ChevronRight, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getFollowUps, updateFollowUp } from "@/services/api";

function formatDueDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const isOverdue = date < now;
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const dateStr2 = date.toLocaleDateString(undefined, { day: "numeric", month: "short" });

  if (isToday) return { label: `Today, ${timeStr}`, overdue: false };
  if (isOverdue) return { label: `${dateStr2}, ${timeStr}`, overdue: true };
  return { label: `${dateStr2}, ${timeStr}`, overdue: false };
}

const PRIORITY_STYLES = {
  high:   "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low:    "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function FollowUpsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("pending");
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(null);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getFollowUps(tab === "pending" ? { status: "pending" } : { status: "completed" });
      setFollowUps(res.data || []);
    } catch {
      setError("Failed to load follow-ups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [tab]);

  const handleComplete = async (id) => {
    try {
      setCompleting(id);
      await updateFollowUp(id, { status: "completed" });
      setFollowUps((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setError("Failed to mark as complete.");
    } finally {
      setCompleting(null);
    }
  };

  // Split pending into overdue vs upcoming
  const now = new Date();
  const overdue  = followUps.filter((f) => f.status === "pending" && new Date(f.due_date) < now);
  const upcoming = followUps.filter((f) => f.status === "pending" && new Date(f.due_date) >= now);

  return (
    <div className="space-y-4 pb-32 overflow-x-hidden max-w-full">
      {/* Header */}
      <Card className="relative border-none bg-primary text-primary-foreground shadow-lg overflow-hidden">
        <CardHeader className="relative">
          <Badge className="w-fit rounded-full bg-white/20 text-white border-none mb-2">
            Task Manager
          </Badge>
          <CardTitle className="text-2xl font-black">Follow-ups</CardTitle>
          <CardDescription className="text-primary-foreground/90 font-medium">
            Track pending tasks and scheduled callbacks.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tab Toggle */}
      <div className="grid grid-cols-2 gap-2 bg-muted/30 p-1 rounded-xl mx-0">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`h-10 rounded-lg text-sm font-bold transition-all ${
            tab === "pending" ? "bg-white shadow text-primary" : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => setTab("completed")}
          className={`h-10 rounded-lg text-sm font-bold transition-all ${
            tab === "completed" ? "bg-white shadow text-primary" : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Completed
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm font-semibold text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading follow-ups…</p>
        </div>
      ) : tab === "pending" ? (
        <div className="space-y-6">
          {/* Overdue */}
          {overdue.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-red-600 flex items-center gap-2 pl-1">
                <AlertCircle className="h-4 w-4" />
                Overdue ({overdue.length})
              </h3>
              {overdue.map((f) => (
                <FollowUpCard
                  key={f.id}
                  item={f}
                  completing={completing}
                  onComplete={handleComplete}
                  onNavigate={() => navigate(`/my-leads/${f.lead_id}`)}
                />
              ))}
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2 pl-1">
                <CalendarClock className="h-4 w-4" />
                Upcoming ({upcoming.length})
              </h3>
              {upcoming.map((f) => (
                <FollowUpCard
                  key={f.id}
                  item={f}
                  completing={completing}
                  onComplete={handleComplete}
                  onNavigate={() => navigate(`/my-leads/${f.lead_id}`)}
                />
              ))}
            </div>
          )}

          {overdue.length === 0 && upcoming.length === 0 && (
            <EmptyState message="No pending follow-ups." />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {followUps.length === 0 ? (
            <EmptyState message="No completed follow-ups yet." />
          ) : (
            followUps.map((f) => (
              <FollowUpCard
                key={f.id}
                item={f}
                completing={null}
                onComplete={null}
                onNavigate={() => navigate(`/my-leads/${f.lead_id}`)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FollowUpCard({ item, completing, onComplete, onNavigate }) {
  const { label, overdue } = formatDueDate(item.due_date);
  const isCompleted = item.status === "completed";

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
              onClick={onNavigate}
            >
              {item.lead_name}
              {item.lead_company && (
                <span className="text-muted-foreground font-medium"> · {item.lead_company}</span>
              )}
            </p>
            {item.title && (
              <p className="text-sm font-semibold text-foreground/80 mt-0.5">{item.title}</p>
            )}
            {item.notes && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.notes}</p>
            )}
          </div>
          <button
            onClick={onNavigate}
            className="text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-dashed border-muted/60">
          <span
            className={`text-xs font-bold flex items-center gap-1 ${
              overdue && !isCompleted ? "text-red-600" : "text-muted-foreground"
            }`}
          >
            <Clock3 className="h-3.5 w-3.5" />
            {label}
          </span>

          {item.priority && (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold uppercase tracking-tight ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium}`}
            >
              {item.priority}
            </Badge>
          )}

          {isCompleted && (
            <Badge className="text-[10px] font-bold bg-emerald-100 text-emerald-700 border-emerald-200 border">
              Completed
            </Badge>
          )}

          {!isCompleted && onComplete && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-7 px-3 text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              disabled={completing === item.id}
              onClick={() => onComplete(item.id)}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              {completing === item.id ? "Saving…" : "Mark Done"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-muted flex flex-col items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <CalendarClock className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-bold text-muted-foreground">{message}</p>
    </div>
  );
}
