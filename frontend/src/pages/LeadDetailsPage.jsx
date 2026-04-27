import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Building2, Clock3, AlertCircle } from "lucide-react";
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
        <h3 className="font-bold text-lg text-foreground mb-6 flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-muted-foreground" />
          Interaction Timeline
        </h3>

        {activities.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-muted">
            <p className="text-muted-foreground font-medium">No interactions recorded yet.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-muted/50 ml-4 space-y-8 pb-4">
            {activities.map((activity, index) => {
              const isCall = activity.activity_type === "call";
              
              return (
                <div key={activity.id} className="relative pl-6 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: \`\${index * 50}ms\` }}>
                  {/* Timeline Node */}
                  <div className={\`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background shadow-sm \${
                    isCall ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                  }\`}>
                    {isCall ? <Phone className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                  </div>

                  {/* Activity Content */}
                  <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-card">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={\`font-bold text-[10px] uppercase tracking-tighter \${
                          isCall ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-blue-700 bg-blue-50 border-blue-200'
                        }\`}>
                          {isCall ? 'Phone Call' : 'Field Visit'}
                        </Badge>
                        <span className="text-xs font-bold text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
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
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap font-medium">
                          {activity.notes}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No notes provided.</p>
                      )}

                      {(activity.duration_seconds || activity.follow_up_required) && (
                        <div className="flex gap-3 pt-2 border-t border-dashed border-muted/60 mt-2">
                          {activity.duration_seconds > 0 && (
                            <span className="text-xs font-semibold text-muted-foreground bg-muted/40 px-2 py-1 rounded">
                              ⏱ {Math.floor(activity.duration_seconds / 60)}m {activity.duration_seconds % 60}s
                            </span>
                          )}
                          {activity.follow_up_required && (
                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
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
        )}
      </div>
    </div>
  );
}
