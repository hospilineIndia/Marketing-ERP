import { useState, useEffect } from "react";
import { BarChart2, Phone, MapPin, CheckCircle2, AlertCircle, Clock3, CalendarClock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKPI, getAdminKPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

function KpiCard({ label, value, sub, color = "primary", icon: Icon }) {
  const colorMap = {
    primary:  "bg-primary/10 text-primary",
    emerald:  "bg-emerald-100 text-emerald-700",
    blue:     "bg-blue-100 text-blue-700",
    amber:    "bg-amber-100 text-amber-700",
    red:      "bg-red-100 text-red-700",
    violet:   "bg-violet-100 text-violet-700",
    muted:    "bg-muted text-muted-foreground",
  };

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
          {Icon && (
            <div className={`rounded-full p-1.5 ${colorMap[color]}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <p className="text-3xl font-black text-foreground leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground font-medium">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SectionLabel({ children }) {
  return (
    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
      {children}
    </h3>
  );
}

function formatSeconds(secs) {
  if (!secs || secs === 0) return "0s";
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [kpi, setKpi] = useState(null);
  const [adminKpi, setAdminKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('today');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const userRes = await getKPI(range);
        setKpi(userRes.data);

        if (isAdmin) {
          const adminRes = await getAdminKPI(range);
          setAdminKpi(adminRes.data);
        }
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isAdmin, range]);

  return (
    <div className="space-y-6 pb-32 overflow-x-hidden max-w-full">

      {/* Header */}
      <Card className="relative border-none bg-primary text-primary-foreground shadow-lg overflow-hidden">
        <CardHeader className="relative">
          <Badge className="w-fit rounded-full bg-white/20 text-white border-none mb-2">
            {isAdmin ? "Admin View" : "My Performance"}
          </Badge>
          <CardTitle className="text-2xl font-black">Dashboard</CardTitle>
          <p className="text-primary-foreground/90 font-medium text-sm">
            {isAdmin ? "Team-wide metrics" : "Today's activity & all-time follow-up stats"}
          </p>
        </CardHeader>
      </Card>

      {/* Range Toggle */}
      <div className="grid grid-cols-3 gap-1 bg-muted/30 p-1 rounded-xl">
        {[{key:'today',label:'Today'},{key:'week',label:'Week'},{key:'month',label:'Month'}].map(({key,label}) => (
          <button
            key={key}
            type="button"
            onClick={() => setRange(key)}
            className={`h-9 rounded-lg text-sm font-bold transition-all ${
              range === key
                ? 'bg-white shadow text-primary'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {label}
          </button>
        ))}
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
          <p className="text-sm text-muted-foreground font-medium">Loading metrics…</p>
        </div>
      ) : kpi ? (
        <div className="space-y-6">

          {/* Section 1: Activity */}
          <div className="space-y-3">
            <SectionLabel>
              {range === 'today' ? "Today's Activity" : range === 'week' ? "This Week's Activity" : "This Month's Activity"}
            </SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="Calls"         value={kpi.calls}            color="emerald" icon={Phone} />
              <KpiCard label="Field Visits"  value={kpi.field_visits}     color="blue"    icon={MapPin} />
              <KpiCard label="Total"         value={kpi.total_activities} color="muted"   icon={BarChart2} />
            </div>
          </div>

          {/* Section 2: Follow-up Summary */}
          <div className="space-y-3">
            <SectionLabel>Follow-up Summary</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                label="Completed"
                value={kpi.followups_completed}
                color="emerald"
                icon={CheckCircle2}
              />
              <KpiCard
                label="Missed"
                value={kpi.followups_missed}
                color="red"
                icon={AlertCircle}
              />
              <KpiCard
                label="Overdue Now"
                value={kpi.overdue_followups ?? 0}
                color={kpi.overdue_followups > 0 ? 'red' : 'muted'}
                icon={AlertCircle}
              />
              <KpiCard
                label="Rate"
                value={`${kpi.completion_rate}%`}
                sub={`${kpi.followups_completed} of ${kpi.followups_created}`}
                color="violet"
                icon={CalendarClock}
              />
            </div>
            {kpi.overdue_followups > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {kpi.overdue_followups} follow-up{kpi.overdue_followups > 1 ? 's are' : ' is'} overdue — check the Follow-ups tab.
              </div>
            )}
          </div>

          {/* Section 3: Performance */}
          <div className="space-y-3">
            <SectionLabel>Performance</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                label="Avg Call Duration"
                value={formatSeconds(kpi.avg_call_duration)}
                color="blue"
                icon={Clock3}
              />
              <KpiCard
                label="Avg Follow-up Time"
                value={kpi.avg_followup_time_hours > 0 ? `${kpi.avg_followup_time_hours}h` : "—"}
                sub="time to complete"
                color="amber"
                icon={CalendarClock}
              />
            </div>
          </div>

          {/* Admin team table */}
          {isAdmin && adminKpi && (
            <div className="space-y-3">
              <SectionLabel>Team Overview</SectionLabel>
              <Card className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  {/* Header row */}
                  <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    <span className="col-span-2">User</span>
                    <span className="text-center">Calls</span>
                    <span className="text-center">Visits</span>
                    <span className="text-center">Rate</span>
                  </div>

                  {adminKpi.length === 0 ? (
                    <p className="text-center py-8 text-sm text-muted-foreground">No data yet.</p>
                  ) : (
                    adminKpi.map((row, idx) => (
                      <div
                        key={row.id}
                        className={`grid grid-cols-5 gap-2 px-4 py-3 text-sm items-center ${
                          idx % 2 === 0 ? "" : "bg-muted/20"
                        }`}
                      >
                        <div className="col-span-2 flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                            {row.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <span className="font-semibold text-foreground truncate">{row.name}</span>
                        </div>
                        <span className="text-center font-bold text-emerald-700">{row.calls}</span>
                        <span className="text-center font-bold text-blue-700">{row.field_visits}</span>
                        <span className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              row.completion_rate >= 75
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : row.completion_rate >= 40
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {row.completion_rate}%
                          </Badge>
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      ) : null}
    </div>
  );
}
