import { Download, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Placeholder filters for date range, field user, and export actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Search lead or company" />
          <Button variant="secondary" className="w-full justify-start rounded-2xl">
            <Filter className="mr-2 h-4 w-4" />
            Apply filters
          </Button>
          <Button className="w-full justify-start rounded-2xl">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Lead Queue</CardTitle>
            <CardDescription>
              Desktop-ready admin shell with room for filters and reporting.
            </CardDescription>
          </div>
          <Badge variant="secondary">Demo</Badge>
        </CardHeader>
        <CardContent className="grid gap-3">
          {["Apex Hospitals", "Northstar Labs", "Metro Health Group"].map((lead) => (
            <div
              key={lead}
              className="rounded-2xl border bg-muted/40 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{lead}</p>
                  <p className="text-sm text-muted-foreground">
                    Assigned to field user placeholder
                  </p>
                </div>
                <Badge variant="secondary">Pending Review</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
