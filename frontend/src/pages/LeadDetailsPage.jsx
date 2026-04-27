import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Building2, Clock3, AlertCircle, Plus } from "lucide-react";

function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  if (diffDays < 7) return `${diffDays} days ago, ${timeStr}`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function getGroupLabel(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return "Previous 7 Days";
  
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLeadDetails, getLeadActivities } from "@/services/api";

export function LeadDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [leadRes, activitiesRes] = await Promise.all([
          getLeadDetails(id),
          getLeadActivities(id)
        ]);
        
        setLead(leadRes.data);
        setActivities(activitiesRes.data);
      } catch (err) {
        console.error("Failed to load lead details", err);
        setError("Could not load lead details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm font-medium text-muted-foreground">Loading timeline...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 py-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="font-medium text-destructive">{error || "Lead not found"}</p>
        <Button variant="outline" onClick={() => navigate("/my-leads")}>
          Back to Leads
        </Button>
      </div>
    );
  }

  const displayedActivities = activities.slice(0, 20);
  const hasMore = activities.length > 20;

  const groupedActivities = displayedActivities.reduce((acc, activity) => {
    const label = getGroupLabel(activity.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(activity);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-32 overflow-x-hidden max-w-full">
      {/* Header Profile Card */}
      <Card className="border-none bg-emerald-50/50 shadow-none relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute left-2 top-2 h-8 w-8 text-emerald-800 hover:bg-emerald-100"
          onClick={() => navigate("/my-leads")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardContent className="pt-10 pb-5 px-6 space-y-4">
          <div>
            <h2 className="text-2xl font-black text-emerald-950">{lead.name}</h2>
            {lead.company && (
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium mt-1">
                <Building2 className="h-4 w-4" />
                {lead.company}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="rounded-full bg-emerald-100 p-1.5 text-emerald-700">
              <Phone className="h-3.5 w-3.5" />
            </div>
            <span className="text-emerald-900">{lead.phone || "No phone"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-muted-foreground" />
            Interaction Timeline
          </h3>
          <Button 
            size="sm" 
            className="rounded-full font-bold shadow-sm"
            onClick={() => navigate("/add-lead", { state: { phone: lead.phone, lead_id: lead.id } })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Activity
          </Button>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-muted flex flex-col items-center justify-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Clock3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">No interactions yet</p>
              <p className="text-sm font-medium text-muted-foreground mt-1">Start by logging your first call or visit</p>
            </div>
            <Button 
              className="mt-4 shadow-sm" 
              onClick={() => navigate("/add-lead", { state: { phone: lead.phone, lead_id: lead.id } })}
            >
              Add Activity
            </Button>
          </div>
        ) : (
          <div className="space-y-8 pb-4">
            {Object.entries(groupedActivities).map(([groupLabel, groupActs]) => (
              <div key={groupLabel} className="space-y-5">
                <h4 className="text-sm font-bold text-muted-foreground sticky top-0 bg-background/95 backdrop-blur py-2 z-10 flex items-center gap-2">
                  <div className="h-px bg-muted flex-grow"></div>
                  {groupLabel}
                  <div className="h-px bg-muted flex-grow"></div>
                </h4>
                
                <div className="relative border-l-2 border-muted/50 ml-4 space-y-7">
                  {groupActs.map((activity, index) => {
                    const isCall = activity.activity_type === "call";
                    return (
                      <div key={activity.id} className="relative pl-6 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 50}ms` }}>
                        {/* Timeline Node */}
                        <div className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background shadow-sm ${
                          isCall ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {isCall ? <Phone className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                        </div>

                        {/* Activity Content */}
                        <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-card">
                          <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className={`font-bold text-[10px] uppercase tracking-tighter ${
                                isCall ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-blue-700 bg-blue-50 border-blue-200'
                              }`}>
                                {isCall ? 'Phone Call' : 'Field Visit'}
                              </Badge>
                              <span className="text-xs font-bold text-muted-foreground">
                                {formatRelativeDate(activity.created_at)}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-3">
                            {isCall && activity.call_outcome && (
                              <div className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-muted text-xs font-semibold text-foreground">
                                Outcome: <span className="ml-1 text-primary">{activity.call_outcome}</span>
                              </div>
                            )}
                            
                            {activity.notes ? (
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap font-medium leading-relaxed">
                                {activity.notes}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No notes provided.</p>
                            )}

                            {(activity.duration_seconds || activity.follow_up_required) && (
                              <div className="flex gap-3 pt-3 border-t border-dashed border-muted/60 mt-3">
                                {activity.duration_seconds > 0 && (
                                  <span className="text-xs font-semibold text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md">
                                    ⏱ {Math.floor(activity.duration_seconds / 60)}m {activity.duration_seconds % 60}s
                                  </span>
                                )}
                                {activity.follow_up_required && (
                                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Flagged for Follow-up
                                  </span>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="pt-6 pb-2 flex justify-center">
                <Button variant="outline" className="rounded-full shadow-sm font-bold text-muted-foreground">
                  Load More Activities
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
