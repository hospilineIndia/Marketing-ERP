import { ArrowUpRight, Clock3, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const leadCards = [
  {
    name: "Apex Hospitals",
    status: "High Intent",
    note: "Interested in a bulk procurement follow-up next week.",
    priority: "HIGH",
  },
  {
    name: "Sunrise Diagnostics",
    status: "Warm Lead",
    note: "Requested pricing details and demo deck.",
    priority: "MEDIUM",
  },
];

export function MyLeadsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm text-muted-foreground">Today&apos;s focus</p>
            <h2 className="text-2xl font-semibold">2 leads need action</h2>
          </div>
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <Sparkles className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {leadCards.map((lead) => (
        <Card key={lead.name}>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-xl">{lead.name}</CardTitle>
              <Badge variant={lead.priority === "HIGH" ? "destructive" : "secondary"}>
                {lead.priority}
              </Badge>
            </div>
            <CardDescription>{lead.status}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{lead.note}</p>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Next step placeholder
              </span>
              <span className="inline-flex items-center gap-2 font-medium text-foreground">
                Open
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
